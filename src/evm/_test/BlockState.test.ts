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

describe('startBlockState', () => {
  test('behavior: recording without a token is refused', async () => {
    const instance = await evm()
    const executed = Evm.transact(instance, transaction())

    // A token from no accumulator cannot identify one.
    expect(() =>
      ExecutedTx.commitTo(executed, {
        '~engine': instance['~engine'],
        '~id': 0n,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [Evm.NoBlockStateError: No block state is being accumulated.

      A transaction was resolved into a block accumulator while none was installed, so nothing was committed.

      Details: Start one with \`Evm.startBlockState\` before resolving into it.]
    `,
    )

    // The handle survived the refusal, so it is still resolvable.
    ExecutedTx.discard(executed)
  })

  test('behavior: a stale token is refused', async () => {
    const instance = await evm()
    const first = Evm.startBlockState(instance)
    // Starting again abandons the first accumulator.
    Evm.startBlockState(instance)

    expect(() => Evm.takeBlockState(instance, first)).toThrowError(
      Evm.NoBlockStateError,
    )
  })

  test('behavior: entries span the block, not the last transaction', async () => {
    const instance = await evm()
    const block = Evm.startBlockState(instance)

    for (const nonce of [0n, 1n, 2n])
      ExecutedTx.commitTo(Evm.transact(instance, transaction({ nonce })), block)

    const state = Evm.takeBlockState(instance, block)
    const account = state.accounts.find(
      (entry) => entry.address.toLowerCase() === sender.toLowerCase(),
    )

    // One entry for three transactions, from the block's start to its end.
    expect(account?.original?.nonce).toBe(0n)
    expect(account?.current?.nonce).toBe(3n)
  })

  test('behavior: every collection enumerates in a stable order', async () => {
    const build = async () => {
      const instance = await evm()
      const block = Evm.startBlockState(instance)
      // Touches `other` before `target`, so an unsorted enumeration would keep
      // insertion order rather than address order.
      ExecutedTx.commitTo(
        Evm.transact(instance, transaction({ nonce: 0n, to: other })),
        block,
      )
      ExecutedTx.commitTo(
        Evm.transact(instance, transaction({ nonce: 1n, to: target })),
        block,
      )
      return Evm.takeBlockState(instance, block)
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
    const block = Evm.startBlockState(instance)
    ExecutedTx.commitTo(Evm.transact(instance, transaction()), block)

    const state = Evm.takeBlockState(instance, block)
    const slot = state.storage.find(
      (entry) => entry.address.toLowerCase() === target,
    )

    expect(slot?.original).toBe(0n)
    expect(slot?.current).toBe(1n)
  })

  test('behavior: a plain commit records nothing in the block', async () => {
    const instance = await evm()
    const block = Evm.startBlockState(instance)

    // `commit` accepts the state without recording it, which is the difference
    // from `commitTo`.
    ExecutedTx.commit(Evm.transact(instance, transaction()))

    expect(Evm.takeBlockState(instance, block).accounts).toEqual([])
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

describe('takeBlockState', () => {
  test('behavior: a token cannot be taken twice', async () => {
    const instance = await evm()
    const block = Evm.startBlockState(instance)

    expect(Evm.takeBlockState(instance, block)).toBeDefined()
    expect(() => Evm.takeBlockState(instance, block)).toThrowError(
      Evm.NoBlockStateError,
    )
  })

  test('behavior: a token from another EVM is refused', async () => {
    const first = await evm()
    const second = await evm()
    const block = Evm.startBlockState(first)
    // Both start at generation one, so a bare number would match the other's
    // accumulator instead of being refused.
    Evm.startBlockState(second)

    expect(() => Evm.takeBlockState(second, block)).toThrowError(
      Evm.NoBlockStateError,
    )
  })
})
