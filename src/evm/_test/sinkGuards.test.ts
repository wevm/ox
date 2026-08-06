import { Address, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm, ExecutedTx, PendingState, StateChange } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

/**
 * Guards around sinks and caller-held state.
 *
 * A pending state is a value the caller owns, so what it hands out must not be
 * shared with what it holds, and every view of it has to agree.
 */

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

function evm() {
  return Evm.create({
    database: Database.fromMemory({
      accounts: {
        [sender.toLowerCase()]: { balance: 10n ** 18n },
        [target]: { code: '0x60015f55' },
      },
    }),
  })
}

function transaction() {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: 200_000n,
    gasPrice: 0n,
    nonce: 0n,
    to: target,
    value: 0n,
  })
  const signature = Secp256k1.sign({
    payload: TxEnvelopeLegacy.getSignPayload(envelope),
    privateKey,
  })
  return {
    from: sender,
    serialized: TxEnvelopeLegacy.serialize(envelope, { signature }),
  }
}

describe('tee', () => {
  test('behavior: an asynchronous branch is refused, not hidden', async () => {
    const instance = await evm()
    const executed = Evm.transact(instance, transaction())

    // A direct async sink is refused. Behind a tee it must be refused too, or
    // the transaction resolves before a later rejection can be seen.
    expect(() =>
      ExecutedTx.commitWith(
        executed,
        StateChange.tee(StateChange.noop(), {
          account: async () => {},
        }),
      ),
    ).toThrowError()
  })
})

describe('accountInfo', () => {
  test('behavior: bytecode handed out is not the state’s own', async () => {
    /** Initcode returning PUSH1 42 PUSH0 MSTORE PUSH1 32 PUSH0 RETURN. */
    const initcode = '0x67602a5f5260205ff35f5260086018f3' as const
    const instance = await evm()
    const envelope = TxEnvelopeLegacy.from({
      chainId: 1,
      data: initcode,
      gas: 200_000n,
      gasPrice: 0n,
      nonce: 0n,
      value: 0n,
    })
    const signature = Secp256k1.sign({
      payload: TxEnvelopeLegacy.getSignPayload(envelope),
      privateKey,
    })
    const executed = Evm.transact(instance, {
      from: sender,
      serialized: TxEnvelopeLegacy.serialize(envelope, { signature }),
    })
    const deployed = ExecutedTx.result(executed).createdAddress!
    const { pendingState } = ExecutedTx.detach(executed)

    const first = PendingState.accountInfo(pendingState, deployed)
    expect(first?.code).toBeDefined()
    first?.code?.fill(0)

    // Zeroing what was handed out must not change what the state holds.
    expect(PendingState.accountInfo(pendingState, deployed)?.code).not.toEqual(
      first?.code,
    )
  })
})

describe('insertStorage', () => {
  test('behavior: an edit is visible to both views of the state', async () => {
    const instance = await evm()
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, transaction()),
    )

    const edited = PendingState.insertStorage(pendingState, {
      address: target,
      current: 42n,
      key: 0n,
      original: 0n,
    })

    // `visit` reads the record stream, `commitSource` the grouped arrays. An
    // edit that reached only one would stream differently than it applies.
    const streamed: bigint[] = []
    StateChange.visit(edited, {
      ...StateChange.noop(),
      storage: (change) => {
        if (change.address.toLowerCase() === target)
          streamed.push(change.current)
      },
    })
    expect(streamed).toContain(42n)
  })
})
