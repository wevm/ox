import { Address, Hex, Secp256k1, TxEnvelopeLegacy } from 'ox'
import { Database, Evm, ExecutedTx } from 'ox/evm'
import { describe, expect, test } from 'vp/test'

/**
 * The asynchronous path must reach the same answers as the synchronous one.
 *
 * evm2 reads through a synchronous trait, so an asynchronous source is served by
 * abandoning the attempt on an unfetched read and repeating it once the value is
 * cached. That is a different execution shape for the same execution, so what it
 * produces has to be identical.
 */

const privateKey =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
const sender = Address.fromPublicKey(Secp256k1.getPublicKey({ privateKey }))
const target = '0x00000000000000000000000000000000000000c0' as const

/** PUSH0 SLOAD, PUSH0 MSTORE, PUSH1 42 PUSH0 SSTORE, PUSH1 32 PUSH0 RETURN. */
const code = '0x5f545f52602a5f5560205ff3' as const

const accounts = {
  [sender.toLowerCase()]: { balance: 10n ** 18n },
  [target]: { code, storage: { '0': 7n } },
} as const

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

/** Counts what the source was asked for, so repeats are observable. */
function source() {
  const memory = Database.fromMemory({ accounts })
  const reads: string[] = []
  return {
    reads,
    database: Database.fromAsync({
      async getAccount(address) {
        reads.push(`account:${address.toLowerCase()}`)
        return memory.getAccount(address)
      },
      async getBlockHash(number) {
        reads.push(`blockHash:${number}`)
        return memory.getBlockHash(number)
      },
      async getCodeByHash(codeHash) {
        reads.push(`code:${codeHash}`)
        return memory.getCodeByHash(codeHash)
      },
      async getStorage(address, key) {
        reads.push(`storage:${address.toLowerCase()}:${key}`)
        return memory.getStorage(address, key)
      },
    }),
  }
}

describe('callTx', () => {
  test('behavior: an asynchronous source reaches the synchronous result', async () => {
    const sync = Evm.callTx(
      await Evm.create({ database: Database.fromMemory({ accounts }) }),
      transaction(),
    )
    const fork = await Evm.create({ database: source().database })

    expect(await Evm.callTx(fork, transaction())).toEqual(sync)
  })

  test('behavior: the source is asked for each value once', async () => {
    const { database, reads } = source()
    const fork = await Evm.create({ database })

    await Evm.callTx(fork, transaction())

    // Every attempt re-executes, but the cache answers what it already has, so
    // the source sees no repeats.
    expect(new Set(reads).size).toBe(reads.length)
    expect(reads.length).toBeGreaterThan(1)

    // A second transaction reuses everything the first cached.
    const before = reads.length
    await Evm.callTx(fork, transaction())
    expect(reads.length).toBe(before)
  })
})

describe('transact', () => {
  test('behavior: the lifecycle is unchanged, and resolution stays synchronous', async () => {
    const fork = await Evm.create({ database: source().database })

    const executed = await Evm.transact(fork, transaction())
    expect(ExecutedTx.result(executed).output).toBe(
      Hex.fromNumber(7, { size: 32 }),
    )

    // Resolution reads nothing, so it is not a promise.
    expect(ExecutedTx.commit(executed).status).toBe(true)

    const second = await Evm.transact(fork, transaction({ nonce: 1n }))
    expect(ExecutedTx.result(second).output).toBe(
      Hex.fromNumber(42, { size: 32 }),
    )
    ExecutedTx.discard(second)
  })

  test('behavior: an abandoned attempt leaves no state behind', async () => {
    const { database } = source()
    const fork = await Evm.create({ database })

    // The first attempt stops on an unfetched read. If it left state or a parked
    // handle behind, this second transaction could not run at all.
    await Evm.transact(fork, transaction()).then(ExecutedTx.discard)

    expect((await Evm.readAccountInfo(fork, sender))?.nonce).toBe(0n)
  })
})

describe('errors', () => {
  test('behavior: a source that rejects surfaces its own error', async () => {
    const fork = await Evm.create({
      database: Database.fromAsync({
        async getAccount() {
          throw new Error('provider offline')
        },
        async getBlockHash() {
          return `0x${'00'.repeat(32)}`
        },
        async getCodeByHash() {
          return new Uint8Array()
        },
        async getStorage() {
          return 0n
        },
      }),
    })

    await expect(Evm.callTx(fork, transaction())).rejects.toThrowError(
      'provider offline',
    )
  })

  test('behavior: an absent sender fails the same way it does synchronously', async () => {
    // Costed, so the missing balance actually matters: a zero-priced transfer of
    // zero value would succeed against an empty account.
    const envelope = TxEnvelopeLegacy.from({
      chainId: 1,
      gas: 100_000n,
      gasPrice: 0n,
      nonce: 0n,
      to: target,
      value: 10n ** 18n,
    })
    const signature = Secp256k1.sign({
      payload: TxEnvelopeLegacy.getSignPayload(envelope),
      privateKey,
    })
    const costed = {
      from: sender,
      serialized: TxEnvelopeLegacy.serialize(envelope, { signature }),
    }

    const absent = {
      async getAccount() {
        return undefined
      },
      async getBlockHash() {
        return `0x${'00'.repeat(32)}` as const
      },
      async getCodeByHash() {
        return new Uint8Array()
      },
      async getStorage() {
        return 0n
      },
    }

    const sync = await Evm.create({ database: Database.fromMemory() })
    const fork = await Evm.create({ database: Database.fromAsync(absent) })

    const expected = (() => {
      try {
        void Evm.callTx(sync, costed)
        return undefined
      } catch (error) {
        return (error as Error).message
      }
    })()

    expect(expected).toBeDefined()
    await expect(Evm.callTx(fork, costed)).rejects.toThrowError(expected)
  })
})

describe('fromAsync', () => {
  test('behavior: a prototype-backed source keeps its reads', async () => {
    const memory = Database.fromMemory({ accounts })

    // A class puts its reads on the prototype, which a spread would not copy.
    class Remote {
      async getAccount(address: Address.Address) {
        return memory.getAccount(address)
      }
      async getBlockHash(number: bigint) {
        return memory.getBlockHash(number)
      }
      async getCodeByHash(codeHash: Hex.Hex) {
        return memory.getCodeByHash(codeHash)
      }
      async getStorage(address: Address.Address, key: bigint) {
        return memory.getStorage(address, key)
      }
    }

    const fork = await Evm.create({
      database: Database.fromAsync(new Remote()),
    })
    expect((await Evm.callTx(fork, transaction())).output).toBe(
      Hex.fromNumber(7, { size: 32 }),
    )
  })

  test('behavior: a source using `this` still works', async () => {
    const memory = Database.fromMemory({ accounts })
    const source = {
      inner: memory,
      async getAccount(address: Address.Address) {
        // Delegation must preserve the receiver.
        return this.inner.getAccount(address)
      },
      async getBlockHash(number: bigint) {
        return this.inner.getBlockHash(number)
      },
      async getCodeByHash(codeHash: Hex.Hex) {
        return this.inner.getCodeByHash(codeHash)
      },
      async getStorage(address: Address.Address, key: bigint) {
        return this.inner.getStorage(address, key)
      },
    }

    const fork = await Evm.create({ database: Database.fromAsync(source) })
    expect((await Evm.callTx(fork, transaction())).status).toBe(true)
  })
})

describe('concurrency', () => {
  test('behavior: an execution started concurrently does not break a read', async () => {
    const { database } = source()
    const fork = await Evm.create({ database })

    // Both start before either finishes fetching. Unserialized, whichever parks
    // a transaction first leaves the engine borrowed, and the other's next
    // attempt fails with `BorrowedError` mid-replay.
    const [called, executed] = await Promise.all([
      Evm.callTx(fork, transaction()),
      Evm.transact(fork, transaction()),
    ])

    expect(called.status).toBe(true)
    expect(ExecutedTx.result(executed)).toEqual(called)
    ExecutedTx.discard(executed)
  })

  test('behavior: a queued operation survives a failing one', async () => {
    let fail = true
    const memory = Database.fromMemory({ accounts })
    const fork = await Evm.create({
      database: Database.fromAsync({
        async getAccount(address) {
          if (fail) {
            fail = false
            throw new Error('transient')
          }
          return memory.getAccount(address)
        },
        getBlockHash: async (number) => memory.getBlockHash(number),
        getCodeByHash: async (codeHash) => memory.getCodeByHash(codeHash),
        getStorage: async (address, key) => memory.getStorage(address, key),
      }),
    })

    const [failed, queued] = await Promise.allSettled([
      Evm.callTx(fork, transaction()),
      Evm.callTx(fork, transaction()),
    ])

    // The queue absorbs the rejection rather than poisoning what follows.
    expect(failed.status).toBe('rejected')
    expect(queued.status).toBe('fulfilled')
  })
})
