import { Address, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Bal, Database, Evm, ExecutedTx } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

/**
 * EIP-7928 block access lists.
 *
 * A list attached to an EVM replaces the database for what it covers, so the
 * property under test throughout is what happens at the edge of coverage.
 */

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

/** PUSH0 SLOAD PUSH0 MSTORE PUSH1 32 PUSH0 RETURN: returns slot 0. */
const code = '0x5f545f5260205ff3' as const

function transaction(options: { nonce?: bigint } = {}) {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: 100_000n,
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

/** Covers the sender and the target's slot 0, so execution needs no database. */
function covering(): Bal.Bal {
  return {
    accounts: [
      {
        address: sender.toLowerCase() as `0x${string}`,
        balanceChanges: [{ balance: 10n ** 18n, index: 0n }],
        codeChanges: [],
        nonceChanges: [{ index: 0n, nonce: 0n }],
        storageChanges: [],
        storageReads: [],
      },
      {
        address: target,
        balanceChanges: [],
        codeChanges: [{ code, index: 0n }],
        nonceChanges: [],
        storageChanges: [{ changes: [{ index: 0n, value: 42n }], slot: 0n }],
        storageReads: [],
      },
    ],
  }
}

describe('setBal', () => {
  test('behavior: an uncovered read is refused, not served from the database', async () => {
    const instance = await evm()
    // Attached but empty, so nothing is covered.
    Evm.setBal(instance, { accounts: [] })

    expect(() =>
      Evm.callTx(instance, transaction()),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Evm.NotCoveredError: A read fell outside the attached block access list.

      The list is consulted instead of the database, so a read it does not cover is refused rather than served.

      Details: Add the account or slot to the list, or allow fallback when executing transactions that are not part of the block.]
    `,
    )
  })

  test('behavior: an uncovered account read is refused the same way', async () => {
    const instance = await evm()
    Evm.setBal(instance, { accounts: [] })

    // Reads outside an execution go through the same coverage gate, so they
    // report the same condition rather than a generic failure.
    expect(() => Evm.readAccountInfo(instance, target)).toThrowError(
      Evm.NotCoveredError,
    )
  })

  test('behavior: fallback lets an uncovered read through', async () => {
    const instance = await evm()
    Evm.setBal(instance, { accounts: [] }, { fallback: true })

    // The database still holds the accounts, so this succeeds.
    expect(Evm.callTx(instance, transaction()).status).toBe(true)
  })

  test('behavior: a covered read is served from the list, not the database', async () => {
    // Coverage comes from a builder run rather than by hand, so the list holds
    // exactly what execution touches.
    const source = await evm()
    Evm.enableBalBuilder(source)
    Evm.setBalIndex(source, 1n)
    ExecutedTx.commit(Evm.transact(source, transaction()))
    const built = Evm.takeBal(source)!

    // The database holds zero in slot 0. Giving the list a different value is what
    // makes the two sources distinguishable from the returned word.
    const bal: Bal.Bal = {
      accounts: built.accounts.map((account) =>
        account.address.toLowerCase() === target
          ? {
              ...account,
              storageChanges: [
                { changes: [{ index: 0n, value: 42n }], slot: 0n },
              ],
              // Dropped: a slot listed as a read loses its changes, because evm2
              // folds reads in after them.
              storageReads: [],
            }
          : account,
      ),
    }

    const instance = await evm()
    Evm.setBal(instance, bal)
    // Transaction 0 reads at index 1, seeing writes recorded before it.
    Evm.setBalIndex(instance, 1n)

    const result = Evm.callTx(instance, transaction())
    expect(result.status).toBe(true)
    expect(result.output).toBe(Hex.fromNumber(42, { size: 32 }))
  })

  test('behavior: clearing restores database reads', async () => {
    const instance = await evm()
    Evm.setBal(instance, { accounts: [] })
    expect(() => Evm.callTx(instance, transaction())).toThrowError(
      Evm.NotCoveredError,
    )

    Evm.clearBal(instance)
    expect(Evm.callTx(instance, transaction()).status).toBe(true)
  })
})

describe('takeBal', () => {
  test('behavior: no builder means no list', async () => {
    expect(Evm.takeBal(await evm())).toBeUndefined()
  })

  test('behavior: the builder records what a transaction touched', async () => {
    const instance = await evm()
    Evm.enableBalBuilder(instance)
    // Transaction 0 records at index 1.
    Evm.setBalIndex(instance, 1n)

    const executed = Evm.transact(instance, transaction())
    ExecutedTx.commit(executed)

    const built = Evm.takeBal(instance)
    // The sender's nonce moves, so it is covered whatever else is.
    expect(Bal.covers(built!, { address: sender })).toBe(true)
    expect(Bal.addresses(built!)).toContain(target)
  })

  test('behavior: taking ends the build', async () => {
    const instance = await evm()
    Evm.enableBalBuilder(instance)
    expect(Evm.takeBal(instance)).toBeDefined()
    expect(Evm.takeBal(instance)).toBeUndefined()
  })

  test('behavior: a built list round-trips back as an attachable one', async () => {
    const instance = await evm()
    Evm.enableBalBuilder(instance)
    Evm.setBalIndex(instance, 1n)
    ExecutedTx.commit(Evm.transact(instance, transaction()))
    const built = Evm.takeBal(instance)!

    // Attaching what was built is the block-validation flow: what one execution
    // recorded is what another can be held to.
    const replay = await evm()
    Evm.setBal(replay, built)
    expect(Evm.callTx(replay, transaction()).status).toBe(true)
  })
})

describe('covers', () => {
  test('behavior: an account is covered, an unlisted one is not', () => {
    const bal = covering()
    expect(Bal.covers(bal, { address: sender })).toBe(true)
    expect(Bal.covers(bal, { address: '0x'.padEnd(42, '9') as never })).toBe(
      false,
    )
  })

  test('behavior: a slot is covered only where the list lists it', () => {
    const bal = covering()
    expect(Bal.covers(bal, { address: target, slot: 0n })).toBe(true)
    expect(Bal.covers(bal, { address: target, slot: 1n })).toBe(false)
  })
})

describe('storageAt', () => {
  test('behavior: a slot listed as a read carries no value', () => {
    // evm2 folds reads in after changes, so the read wins and the value comes
    // from the database instead.
    const bal: Bal.Bal = {
      accounts: [
        {
          address: target,
          balanceChanges: [],
          codeChanges: [],
          nonceChanges: [],
          storageChanges: [{ changes: [{ index: 1n, value: 10n }], slot: 0n }],
          storageReads: [0n],
        },
      ],
    }

    expect(
      Bal.storageAt(bal, { address: target, index: 9n, slot: 0n }),
    ).toBeUndefined()
  })

  test('behavior: the most recent write strictly before the index wins', () => {
    const bal: Bal.Bal = {
      accounts: [
        {
          address: target,
          balanceChanges: [],
          codeChanges: [],
          nonceChanges: [],
          storageChanges: [
            {
              changes: [
                { index: 1n, value: 10n },
                { index: 3n, value: 30n },
              ],
              slot: 0n,
            },
          ],
          storageReads: [],
        },
      ],
    }

    const at = (index: bigint) =>
      Bal.storageAt(bal, { address: target, index, slot: 0n })

    // A write is visible only strictly after its own index, so index 1 does not
    // yet see the write recorded at index 1.
    expect(at(0n)).toBeUndefined()
    expect(at(1n)).toBeUndefined()
    expect(at(2n)).toBe(10n)
    expect(at(3n)).toBe(10n)
    expect(at(4n)).toBe(30n)
    expect(at(9n)).toBe(30n)
  })

  test('behavior: an unlisted slot has no value', () => {
    expect(
      Bal.storageAt(covering(), { address: target, index: 0n, slot: 7n }),
    ).toBeUndefined()
  })
})
