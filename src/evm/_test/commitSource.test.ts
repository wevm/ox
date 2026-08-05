import { Address, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm, ExecutedTx, PendingState, StateChange } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

/**
 * Applying caller-held state back to an EVM.
 *
 * The round trip is detach, edit, apply. What matters is that the applied state
 * takes effect and that a transaction's lifecycle markers do not survive it.
 */

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

/** PUSH1 1, PUSH0, SSTORE: writes slot 0. */
const code = '0x60015f55' as const

function transaction(options: { nonce?: bigint } = {}) {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: 200_000n,
    gasPrice: 0n,
    nonce: options.nonce ?? 0n,
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

function evm() {
  return Evm.create({
    database: Database.fromMemory({
      accounts: {
        [sender.toLowerCase()]: { balance: 10n ** 18n },
        [target]: { code },
      },
    }),
  })
}

describe('commitSource', () => {
  test('behavior: detached state applied back takes effect', async () => {
    const instance = await evm()
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, transaction()),
    )

    // Detaching leaves the EVM as it was, so the nonce is still zero and the
    // same transaction runs again.
    expect(Evm.readAccountInfo(instance, sender)?.nonce).toBe(0n)

    Evm.commitSource(instance, pendingState)

    // Applied, so the sender's nonce moved without the transaction committing.
    expect(Evm.readAccountInfo(instance, sender)?.nonce).toBe(1n)
  })

  test('behavior: an edited account is what gets applied', async () => {
    const instance = await evm()
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, transaction()),
    )

    const account = PendingState.accountInfo(pendingState, sender)!
    const edited = PendingState.insertAccount(pendingState, {
      address: sender,
      current: { ...account, nonce: 9n },
      original: account,
    })
    Evm.commitSource(instance, edited)

    expect(Evm.readAccountInfo(instance, sender)?.nonce).toBe(9n)
  })

  test('behavior: an edited slot is what gets applied', async () => {
    // A second account whose code returns slot 0, so the applied value is
    // observable as returned data rather than inferred.
    const reader = '0x00000000000000000000000000000000000000c1' as const
    const instance = await Evm.create({
      database: Database.fromMemory({
        accounts: {
          [sender.toLowerCase()]: { balance: 10n ** 18n },
          [reader]: { code: '0x5f545f5260205ff3' },
          [target]: { code },
        },
      }),
    })

    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, transaction()),
    )
    const edited = PendingState.insertStorage(pendingState, {
      address: reader,
      current: 42n,
      key: 0n,
      original: 0n,
    })
    Evm.commitSource(instance, edited)

    const envelope = TxEnvelopeLegacy.from({
      chainId: 1,
      gas: 200_000n,
      gasPrice: 0n,
      nonce: 1n,
      to: reader,
      value: 0n,
    })
    const signature = Secp256k1.sign({
      payload: TxEnvelopeLegacy.getSignPayload(envelope),
      privateKey,
    })
    const result = Evm.callTx(instance, {
      from: sender,
      serialized: TxEnvelopeLegacy.serialize(envelope, { signature }),
    })

    expect(result.output).toBe(Hex.fromNumber(42, { size: 32 }))
  })

  test('behavior: applying twice is applying the same values twice', async () => {
    const instance = await evm()
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, transaction()),
    )

    Evm.commitSource(instance, pendingState)
    Evm.commitSource(instance, pendingState)

    // The values are absolute, not deltas, so a second application is a no-op.
    expect(Evm.readAccountInfo(instance, sender)?.nonce).toBe(1n)
  })

  test('behavior: empty state applies nothing', async () => {
    const instance = await evm()
    const before = Evm.readAccountInfo(instance, sender)

    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, transaction()),
    )
    const emptied = PendingState.insertAccount(pendingState, {
      address: sender,
      current: before!,
      original: before!,
    })
    Evm.commitSource(instance, emptied)

    expect(Evm.readAccountInfo(instance, sender)).toEqual(before)
  })
})

describe('detach, edit, commit', () => {
  test('behavior: a detached selfdestruct carries a marker and a wipe', async () => {
    /**
     * PUSH1 1, PUSH0, SSTORE, PUSH20 sender, SELFDESTRUCT.
     *
     * Deployed as initcode, so the account is created and destroyed in one
     * transaction. EIP-6780 only deletes an account under that condition, which
     * is what makes a lifecycle marker appear at all.
     */
    const initcode = `0x60015f5573${sender.slice(2)}ff` as const
    const instance = await Evm.create({
      database: Database.fromMemory({
        accounts: { [sender.toLowerCase()]: { balance: 10n ** 18n } },
      }),
    })

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
    const { pendingState } = ExecutedTx.detach(
      Evm.transact(instance, {
        from: sender,
        serialized: TxEnvelopeLegacy.serialize(envelope, { signature }),
      }),
    )

    const seen = { selfdestructed: 0, wipes: 0 }
    StateChange.visit(pendingState, {
      ...StateChange.noop(),
      account: (change) => {
        if (change.selfdestructed) seen.selfdestructed += 1
      },
      storageWipe: () => {
        seen.wipes += 1
      },
    })

    // The premise for the next test: this state is what gets re-inserted.
    expect(seen.selfdestructed).toBeGreaterThan(0)
    expect(seen.wipes).toBeGreaterThan(0)
  })

  test('behavior: applying a wipe does not clear the account it names', async () => {
    /** PUSH0 SLOAD PUSH0 MSTORE PUSH1 32 PUSH0 RETURN: returns slot 0. */
    const keeper = '0x00000000000000000000000000000000000000c3' as const
    const instance = await Evm.create({
      database: Database.fromMemory({
        accounts: {
          [sender.toLowerCase()]: { balance: 10n ** 18n },
          [keeper]: { code: '0x5f545f5260205ff3', storage: { '0x0': 9n } },
        },
      }),
    })

    // A wipe naming an account whose storage must survive. Built directly rather
    // than from a real selfdestruct, whose wipe names the destroyed account and
    // so could not show the harm.
    Evm.commitSource(
      instance,
      PendingState.from({
        accountReads: [],
        accounts: [],
        bytecode: [],
        records: [],
        storage: [],
        storageReads: [],
        storageWipes: [keeper],
      }),
    )

    const envelope = TxEnvelopeLegacy.from({
      chainId: 1,
      gas: 200_000n,
      gasPrice: 0n,
      nonce: 0n,
      to: keeper,
      value: 0n,
    })
    const signature = Secp256k1.sign({
      payload: TxEnvelopeLegacy.getSignPayload(envelope),
      privateKey,
    })
    const result = Evm.callTx(instance, {
      from: sender,
      serialized: TxEnvelopeLegacy.serialize(envelope, { signature }),
    })

    // Slot 0 still reads 9, so the wipe was dropped rather than replayed.
    expect(result.output).toBe(Hex.fromNumber(9, { size: 32 }))
  })
})
