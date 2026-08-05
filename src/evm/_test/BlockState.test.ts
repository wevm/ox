import { Address, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm, ExecutedTx } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

/**
 * Block state accumulation.
 *
 * The accumulator spans a block rather than a transaction, so the properties
 * under test are what survives several of them and in what order it enumerates.
 */

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const
const other = '0x00000000000000000000000000000000000000c1' as const

/** PUSH1 1, PUSH0, SSTORE: writes slot 0. */
const code = '0x60015f55' as const

function transaction(options: { nonce?: bigint; to?: Address.Address } = {}) {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: 200_000n,
    gasPrice: 0n,
    nonce: options.nonce ?? 0n,
    to: options.to ?? target,
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
        [other]: { code },
        [target]: { code },
      },
    }),
  })
}

describe('setBlockState', () => {
  test('behavior: nothing is gathered until it is started', async () => {
    expect(Evm.takeBlockState(await evm())).toBeUndefined()
  })

  test('behavior: resolving into an absent accumulator fails', async () => {
    const instance = await evm()
    const executed = Evm.transact(instance, transaction())

    expect(() =>
      ExecutedTx.commitTo(executed),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Evm.NoBlockStateError: No block state is being accumulated.

      A transaction was resolved into a block accumulator while none was installed, so nothing was committed.

      Details: Start one with \`Evm.setBlockState\` before resolving into it.]
    `,
    )

    // The handle is still outstanding, so the engine is released before the next test.
    ExecutedTx.discard(executed)
  })

  test('behavior: entries span the block, not the last transaction', async () => {
    const instance = await evm()
    Evm.setBlockState(instance, true)

    for (const nonce of [0n, 1n, 2n])
      ExecutedTx.commitTo(Evm.transact(instance, transaction({ nonce })))

    const block = Evm.takeBlockState(instance)!
    const account = block.accounts.find(
      (entry) => entry.address.toLowerCase() === sender.toLowerCase(),
    )

    // One entry for three transactions, from the block's start to its end.
    expect(account?.original?.nonce).toBe(0n)
    expect(account?.current?.nonce).toBe(3n)
  })

  test('behavior: every collection enumerates in a stable order', async () => {
    const build = async () => {
      const instance = await evm()
      Evm.setBlockState(instance, true)
      // Touches `other` before `target`, so an unsorted enumeration would keep
      // insertion order rather than address order.
      ExecutedTx.commitTo(
        Evm.transact(instance, transaction({ nonce: 0n, to: other })),
      )
      ExecutedTx.commitTo(
        Evm.transact(instance, transaction({ nonce: 1n, to: target })),
      )
      return Evm.takeBlockState(instance)!
    }

    const first = await build()
    expect(await build()).toEqual(first)

    const addresses = first.accounts.map((entry) => entry.address.toLowerCase())
    expect([...addresses].sort()).toEqual(addresses)
    const slots = first.storage.map(
      (entry) => `${entry.address.toLowerCase()}:${entry.key}`,
    )
    expect([...slots].sort()).toEqual(slots)
  })

  test('behavior: storage carries the value from before the block', async () => {
    const instance = await evm()
    Evm.setBlockState(instance, true)
    ExecutedTx.commitTo(Evm.transact(instance, transaction()))

    const block = Evm.takeBlockState(instance)!
    const slot = block.storage.find(
      (entry) => entry.address.toLowerCase() === target,
    )

    expect(slot?.original).toBe(0n)
    expect(slot?.current).toBe(1n)
  })

  test('behavior: taking ends the gathering', async () => {
    const instance = await evm()
    Evm.setBlockState(instance, true)
    expect(Evm.takeBlockState(instance)).toBeDefined()
    expect(Evm.takeBlockState(instance)).toBeUndefined()
  })

  test('behavior: stopping discards what was gathered', async () => {
    const instance = await evm()
    Evm.setBlockState(instance, true)
    ExecutedTx.commitTo(Evm.transact(instance, transaction()))

    Evm.setBlockState(instance, false)
    expect(Evm.takeBlockState(instance)).toBeUndefined()
  })

  test('behavior: a plain commit records nothing in the block', async () => {
    const instance = await evm()
    Evm.setBlockState(instance, true)

    // `commit` accepts the state without recording it, which is the difference
    // from `commitTo`.
    ExecutedTx.commit(Evm.transact(instance, transaction()))

    expect(Evm.takeBlockState(instance)?.accounts).toEqual([])
  })
})

describe('warmPrecompiles', () => {
  test('behavior: warming does not change what a transaction reports', async () => {
    const cold = await evm()
    const expected = Evm.callTx(cold, transaction())

    const warm = await evm()
    Evm.warmPrecompiles(warm)

    // The transaction touches no precompile, so warming is invisible to it.
    expect(Evm.callTx(warm, transaction())).toEqual(expected)
  })

  test('behavior: warming twice is the same as warming once', async () => {
    const once = await evm()
    Evm.warmPrecompiles(once)
    const expected = Evm.callTx(once, transaction())

    const twice = await evm()
    Evm.warmPrecompiles(twice)
    Evm.warmPrecompiles(twice)

    expect(Evm.callTx(twice, transaction())).toEqual(expected)
  })
})
