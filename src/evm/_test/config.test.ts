import { Address, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

/**
 * Version overrides, and the setters that replace them.
 *
 * An override has to change what execution does, not merely cross the boundary,
 * so each of these turns a rule off or moves a limit and observes the outcome.
 */

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

/** PUSH1 42, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN */
const code = '0x602a5f5260205ff3' as const

function transaction(options: { gasPrice?: bigint; nonce?: bigint } = {}) {
  const envelope = TxEnvelopeLegacy.from({
    chainId: 1,
    gas: 100_000n,
    gasPrice: options.gasPrice ?? 0n,
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

const accounts = {
  [sender.toLowerCase()]: { balance: 10n ** 18n },
  [target]: { code },
} as const

function evm(version?: Evm.Version) {
  return Evm.create({
    database: Database.fromMemory({ accounts }),
    ...(version ? { version } : {}),
  })
}

describe('version', () => {
  test('behavior: the specification supplies defaults, not an empty set', async () => {
    // A wrong nonce is rejected, which only happens when the nonce check is on.
    // An empty feature set would accept this.
    const instance = await evm()
    expect(() =>
      Evm.callTx(instance, transaction({ nonce: 7n })),
    ).toThrowError()
  })

  test('behavior: turning a check off changes what executes', async () => {
    const relaxed = await evm({ features: { nonceCheck: false } })

    // The same transaction the default configuration rejects.
    expect(Evm.callTx(relaxed, transaction({ nonce: 7n })).output).toBe(
      Hex.fromNumber(42, { size: 32 }),
    )
  })

  test('behavior: an unmentioned flag keeps its specification value', async () => {
    // Only the nonce check is named, so the balance check stays on and an
    // unfundable transaction still fails.
    const relaxed = await Evm.create({
      database: Database.fromMemory({}),
      version: { features: { nonceCheck: false } },
    })

    expect(() =>
      Evm.callTx(relaxed, transaction({ gasPrice: 1n })),
    ).toThrowError()
  })

  test('behavior: a gas parameter override changes the gas charged', async () => {
    /** PUSH0 SLOAD POP, PUSH0 PUSH0 PUSH0 LOG1, STOP */
    const logs = '0x5f54505f5f5fa100' as const
    const accounts = {
      [sender.toLowerCase()]: { balance: 10n ** 18n },
      [target]: { code: logs },
    }
    const create = (version?: Evm.Version) =>
      Evm.create({
        database: Database.fromMemory({ accounts }),
        ...(version ? { version } : {}),
      })

    const plain = await create()
    // A topic costs 375 by default, so 1000 is exactly 625 more for one topic.
    const dearer = await create({ gas: { logtopic: 1000 } })

    expect(
      Evm.callTx(dearer, transaction()).totalGasSpent -
        Evm.callTx(plain, transaction()).totalGasSpent,
    ).toBe(625n)
  })

  test('behavior: a scalar limit override is enforced', async () => {
    const capped = await evm({ txGasLimitCap: 50_000n })

    // The transaction asks for 100,000 gas, over the cap this sets.
    expect(() => Evm.callTx(capped, transaction())).toThrowError()
  })

  test('behavior: an unknown feature name is refused', async () => {
    await expect(
      evm({ features: { notAFeature: true } as never }),
    ).rejects.toThrowError()
  })
})

describe('setBlock', () => {
  test('behavior: replaces block values and keeps the rest', async () => {
    /** NUMBER, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN */
    const reportsNumber = '0x435f5260205ff3' as const
    const instance = await Evm.create({
      block: { number: 5n },
      database: Database.fromMemory({
        accounts: {
          [sender.toLowerCase()]: { balance: 10n ** 18n },
          [target]: { code: reportsNumber },
        },
      }),
    })

    expect(Evm.callTx(instance, transaction()).output).toBe(
      Hex.fromNumber(5, { size: 32 }),
    )

    Evm.setBlock(instance, { number: 9n })
    expect(Evm.callTx(instance, transaction()).output).toBe(
      Hex.fromNumber(9, { size: 32 }),
    )

    // The nonce check survived the block change.
    expect(() =>
      Evm.callTx(instance, transaction({ nonce: 7n })),
    ).toThrowError()
  })
})

describe('setExecutionConfig', () => {
  test('behavior: applies overrides to a running EVM', async () => {
    const instance = await evm()
    expect(() =>
      Evm.callTx(instance, transaction({ nonce: 7n })),
    ).toThrowError()

    Evm.setExecutionConfig(instance, {
      version: { features: { nonceCheck: false } },
    })
    expect(Evm.callTx(instance, transaction({ nonce: 7n })).status).toBe(true)
  })

  test('behavior: overrides replace rather than merge', async () => {
    const instance = await evm({ features: { nonceCheck: false } })
    expect(Evm.callTx(instance, transaction({ nonce: 7n })).status).toBe(true)

    // A new set that does not name the nonce check returns it to the
    // specification's own value.
    Evm.setExecutionConfig(instance, { version: { txGasLimitCap: 200_000n } })
    expect(() =>
      Evm.callTx(instance, transaction({ nonce: 7n })),
    ).toThrowError()
  })
})

describe('setBlockAndExecutionConfig', () => {
  test('behavior: applies both at once', async () => {
    /** NUMBER, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN */
    const reportsNumber = '0x435f5260205ff3' as const
    const instance = await Evm.create({
      database: Database.fromMemory({
        accounts: {
          [sender.toLowerCase()]: { balance: 10n ** 18n },
          [target]: { code: reportsNumber },
        },
      }),
    })

    Evm.setBlockAndExecutionConfig(instance, {
      block: { number: 3n },
      version: { features: { nonceCheck: false } },
    })

    const result = Evm.callTx(instance, transaction({ nonce: 7n }))
    expect(result.output).toBe(Hex.fromNumber(3, { size: 32 }))
  })
})

describe('overrides are bounded and copied', () => {
  test('behavior: a value wider than the target holds is refused', async () => {
    // `usize` is 32-bit on the shipped wasm build, so an unchecked cast would
    // turn this into zero and change deployment behavior instead of failing.
    await expect(evm({ maxCodeSize: 2n ** 32n })).rejects.toThrowError()

    // One below the boundary is still accepted.
    await expect(evm({ maxCodeSize: 2n ** 32n - 1n })).resolves.toBeDefined()
  })

  test('behavior: mutating the options afterwards does not change the EVM', async () => {
    const version = { features: { nonceCheck: false } }
    const pending = Evm.create({
      database: Database.fromMemory({ accounts }),
      version,
    })

    // Encoding happens after WebAssembly instantiation, so without a snapshot
    // this would put the check back on before the request is written.
    version.features.nonceCheck = true

    const instance = await pending
    expect(Evm.callTx(instance, transaction({ nonce: 7n })).status).toBe(true)
  })
})

describe('setters on an asynchronous EVM', () => {
  /** NUMBER, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN */
  const reportsNumber = '0x435f5260205ff3' as const

  function source() {
    const memory = Database.fromMemory({
      accounts: {
        [sender.toLowerCase()]: { balance: 10n ** 18n },
        [target]: { code: reportsNumber },
      },
    })
    return Database.fromAsync({
      getAccount: async (address) => memory.getAccount(address),
      getBlockHash: async (number) => memory.getBlockHash(number),
      getCodeByHash: async (codeHash) => memory.getCodeByHash(codeHash),
      getStorage: async (address, key) => memory.getStorage(address, key),
    })
  }

  test('behavior: a setter waits for an execution already in flight', async () => {
    const fork = await Evm.create({
      block: { number: 5n },
      database: source(),
    })

    // Started before the setter, so it must complete under block 5 even though
    // the setter is issued while it is still fetching state.
    const executing = Evm.callTx(fork, transaction())
    const configuring = Evm.setBlock(fork, { number: 9n })

    const [result] = await Promise.all([executing, configuring])
    expect(result.output).toBe(Hex.fromNumber(5, { size: 32 }))

    // The setter did land, so the next execution sees the new block.
    expect((await Evm.callTx(fork, transaction())).output).toBe(
      Hex.fromNumber(9, { size: 32 }),
    )
  })
})
