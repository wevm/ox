import { Address, Hex, Secp256k1 } from 'ox'
import {
  Database,
  Evm,
  ExecutedTx,
  PendingState,
  StateChange,
  System,
} from 'ox/evm'
import { describe, expect, test } from 'vp/test'

/**
 * Protocol system calls.
 *
 * A system call bypasses the validation a transaction goes through, so the
 * properties worth testing are what it skips and that its handle resolves the
 * same way.
 */

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))

/** CALLDATALOAD(0), PUSH0, SSTORE: stores the first calldata word in slot 0. */
const code = '0x5f355f55' as const

function evm() {
  return Evm.create({
    database: Database.fromMemory({
      accounts: {
        [sender.toLowerCase()]: { balance: 10n ** 18n },
        [System.historyStorage]: { code },
      },
    }),
  })
}

const data = Hex.fromNumber(7, { size: 32 })

/** Collects the storage changes a pending state carries. */
function storage(state: PendingState.PendingState) {
  const changes: StateChange.Storage[] = []
  StateChange.visit(state, {
    ...StateChange.noop(),
    storage: (change) => changes.push(change),
  })
  return changes
}

describe('systemCall', () => {
  test('behavior: the call runs and writes what it was given', async () => {
    const instance = await evm()

    const executed = Evm.systemCall(instance, {
      address: System.historyStorage,
      data,
    })
    expect(ExecutedTx.result(executed).status).toBe(true)

    // Detaching shows the write rather than inferring it from a later read.
    const { pendingState } = ExecutedTx.detach(executed)
    expect(
      storage(pendingState).some(
        (change) =>
          change.address.toLowerCase() === System.historyStorage &&
          change.key === 0n &&
          change.current === 7n,
      ),
    ).toBe(true)
  })

  test('behavior: no sender balance is needed, and no nonce moves', async () => {
    // An EVM with no funded account at all: a transaction could not run here.
    const instance = await Evm.create({
      database: Database.fromMemory({
        accounts: { [System.historyStorage]: { code } },
      }),
    })

    const executed = Evm.systemCall(instance, {
      address: System.historyStorage,
      data,
    })
    const { pendingState } = ExecutedTx.detach(executed)

    // The system caller is not charged and its nonce is untouched, so it does
    // not appear as a changed account the way a transaction sender would.
    const caller = PendingState.accountInfo(pendingState, System.address)
    expect(caller?.nonce ?? 0n).toBe(0n)
  })

  test('behavior: the handle resolves through the block accumulator', async () => {
    const instance = await evm()
    Evm.setBlockState(instance, true)

    ExecutedTx.commitTo(
      Evm.systemCall(instance, { address: System.historyStorage, data }),
    )

    const block = Evm.takeBlockState(instance)!
    // A block records its system calls alongside its transactions.
    expect(
      block.storage.some(
        (entry) =>
          entry.address.toLowerCase() === System.historyStorage &&
          entry.current === 7n,
      ),
    ).toBe(true)
  })

  test('behavior: discarding leaves nothing behind', async () => {
    const instance = await evm()
    ExecutedTx.discard(
      Evm.systemCall(instance, { address: System.historyStorage, data }),
    )

    // A repeat sees slot 0 still at zero, so the discarded write did not land.
    const { pendingState } = ExecutedTx.detach(
      Evm.systemCall(instance, { address: System.historyStorage, data }),
    )
    const slot = storage(pendingState).find(
      (change) => change.address.toLowerCase() === System.historyStorage,
    )
    expect(slot?.original).toBe(0n)
    expect(slot?.current).toBe(7n)
  })

  test('behavior: calling an address with no code succeeds without effect', async () => {
    const instance = await evm()

    // evm2 does not deploy system contracts, so an empty address just returns.
    const executed = Evm.systemCall(instance, {
      address: System.beaconRoots,
      data,
    })
    expect(ExecutedTx.result(executed).status).toBe(true)
    ExecutedTx.discard(executed)
  })

  test('behavior: a system call is not traced', async () => {
    const instance = await evm()
    Evm.setInspector(instance, {})

    const executed = Evm.systemCall(instance, {
      address: System.historyStorage,
      data,
    })

    // evm2 removes its inspector for the duration of a system call, and the
    // collector lives outside the engine, so recording was on and captured
    // nothing. An empty trace says that; an absent one would say it was off.
    expect(ExecutedTx.result(executed).trace).toEqual({
      events: [],
      truncated: false,
    })
    ExecutedTx.discard(executed)
  })
})

describe('addresses', () => {
  test('behavior: every address is listed once and normalized', () => {
    expect(System.addresses.length).toBe(6)
    expect(new Set(System.addresses).size).toBe(6)
    for (const address of System.addresses)
      expect(address).toBe(address.toLowerCase())
  })
})
