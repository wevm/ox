import type * as Address from '../../core/Address.js'
import type * as Bytes from '../../core/Bytes.js'
import * as Errors from '../../core/Errors.js'
import type * as Hex from '../../core/Hex.js'
import * as Database from './database.js'

/**
 * Drives an asynchronous source through synchronous engine reads.
 *
 * evm2 reads through a synchronous trait, and its asynchronous form needs native
 * fiber stacks that WebAssembly has no equivalent for. So the engine is never
 * suspended: a read the cache cannot serve abandons the attempt, the caller
 * awaits the source, and the operation repeats. Execution is deterministic, so
 * repeating with more cached state converges.
 *
 * The cache lives here rather than in the adapter, which keeps a cache hit a
 * plain synchronous lookup and means the source sees each distinct read once,
 * however many attempts an operation takes.
 *
 * @internal
 */
export type Driver = {
  /** Reads the engine performs, serving the cache and recording misses. */
  database: Database.Database
  /**
   * Awaits the recorded read and caches it.
   *
   * @returns Whether a read was outstanding. `false` means the attempt failed
   *   for some other reason and repeating it would not help.
   */
  settle(): Promise<boolean>
  /**
   * Runs `operation` after every operation queued before it.
   *
   * evm2 owns one EVM exclusively. Awaiting a source hands control back to the
   * caller mid-operation, so without this a second operation could execute, park
   * a transaction, or commit state while the first is still replaying.
   */
  serialize<result>(operation: () => Promise<result>): Promise<result>
}

/**
 * An asynchronous source, marked so the binding can tell it from a synchronous
 * one without calling a read to find out.
 *
 * @internal
 */
export type Marked = Async & {
  /** @internal */
  readonly '~async': true
}

/** Whether a database reads asynchronously. @internal */
export function isAsync(database: object): database is Marked {
  return '~async' in database && database['~async'] === true
}

/** Creates a driver over `source`. @internal */
export function driver(source: Async): Driver {
  type Request =
    | { address: Address.Address; kind: 'account' }
    | { address: Address.Address; key: bigint; kind: 'storage' }
    | { codeHash: Hex.Hex; kind: 'code' }
    | { kind: 'blockHash'; number: bigint }

  const accounts = new Map<string, Database.Account | undefined>()
  const blockHashes = new Map<bigint, Hex.Hex>()
  const code = new Map<string, Bytes.Bytes>()
  const storage = new Map<string, bigint>()

  // The read that abandoned the last attempt. One per attempt, because evm2
  // unwinds on the first miss.
  let request: Request | undefined

  /** Records `pending` and abandons the attempt. */
  function miss(value: Request): never {
    request = value
    throw new Database.PendingError()
  }

  // Tail of the operation queue. Rejections are absorbed so one failed
  // operation does not fail the next.
  let queue: Promise<unknown> = Promise.resolve()

  return {
    database: {
      getAccount(address) {
        const key = address.toLowerCase()
        if (accounts.has(key)) return accounts.get(key)
        return miss({ address, kind: 'account' })
      },
      getBlockHash(number) {
        const hash = blockHashes.get(number)
        if (hash) return hash
        return miss({ kind: 'blockHash', number })
      },
      getCodeByHash(codeHash) {
        const key = codeHash.toLowerCase()
        const bytes = code.get(key)
        if (bytes) return bytes
        return miss({ codeHash, kind: 'code' })
      },
      getStorage(address, key) {
        const slot = `${address.toLowerCase()}:${key}`
        const value = storage.get(slot)
        if (value !== undefined) return value
        return miss({ address, key, kind: 'storage' })
      },
    },
    serialize(operation) {
      const next = queue.then(operation, operation)
      queue = next.catch(() => {})
      return next
    },
    async settle() {
      const outstanding = request
      if (!outstanding) return false
      request = undefined

      // A source that throws propagates: the read failed rather than pended, and
      // repeating the operation would ask for it again.
      if (outstanding.kind === 'account')
        accounts.set(
          outstanding.address.toLowerCase(),
          await source.getAccount(outstanding.address),
        )
      else if (outstanding.kind === 'blockHash')
        blockHashes.set(
          outstanding.number,
          await source.getBlockHash(outstanding.number),
        )
      else if (outstanding.kind === 'code')
        code.set(
          outstanding.codeHash.toLowerCase(),
          await source.getCodeByHash(outstanding.codeHash),
        )
      else
        storage.set(
          `${outstanding.address.toLowerCase()}:${outstanding.key}`,
          await source.getStorage(outstanding.address, outstanding.key),
        )
      return true
    },
  }
}

/**
 * State an EVM reads through, asynchronously.
 *
 * The same reads {@link ox#Database.(Database:type)} serves, returning promises.
 * A source backed by a node or a database implements this; the binding turns it
 * into the synchronous reads the engine performs.
 */
export type Async = {
  /** Reads an account, or `undefined` when it does not exist. */
  getAccount(
    address: Address.Address,
  ): Promise<Database.Account | undefined> | Database.Account | undefined
  /** Reads a historical block hash. */
  getBlockHash(number: bigint): Promise<Hex.Hex> | Hex.Hex
  /** Reads code by its hash. */
  getCodeByHash(codeHash: Hex.Hex): Promise<Bytes.Bytes> | Bytes.Bytes
  /** Reads a persistent storage slot, or `0n` when unset. */
  getStorage(address: Address.Address, key: bigint): Promise<bigint> | bigint
}

/**
 * Runs `attempt` until no read is outstanding.
 *
 * Each attempt either completes or abandons on one unfetched read, so the loop
 * makes progress: every pass caches one more value than the last.
 *
 * @internal
 */
export async function until<result>(
  driver: Driver,
  attempt: () => result,
): Promise<result> {
  // Bounded so a source that keeps reporting the same read as unfetched fails
  // loudly rather than spinning. Real transactions read far fewer values.
  type Outcome = { kind: 'pending' } | { kind: 'value'; value: result }

  for (let reads = 0; reads < maxReads; reads++) {
    const outcome: Outcome = (() => {
      try {
        return { kind: 'value', value: attempt() }
      } catch (error) {
        if (error instanceof PendingError) return { kind: 'pending' }
        throw error
      }
    })()
    if (outcome.kind === 'value') return outcome.value
    if (!(await driver.settle())) throw new StalledError({ reads })
  }
  throw new StalledError({ reads: maxReads })
}

/** Reads one operation may make before the driver gives up. */
const maxReads = 100_000

/**
 * Thrown when an engine operation reports a read the driver cannot resolve.
 *
 * Reaching this means the source answered a read and the engine asked for the
 * same one again, which no correct source does.
 */
export class StalledError extends Errors.BaseError {
  override readonly name = 'Evm.StalledError'

  constructor({ reads }: { reads: number }) {
    super('An asynchronous state read made no progress.', {
      metaMessages: [
        `Reads served: ${reads}`,
        'The source reported a value the engine then asked for again.',
      ],
    })
  }
}

/**
 * Thrown by the engine when an operation stopped on an unfetched read.
 *
 * Never surfaces to a caller: the driver catches it, awaits the source, and
 * repeats the operation.
 *
 * @internal
 */
export class PendingError extends Errors.BaseError {
  override readonly name = 'Evm.PendingError'

  constructor() {
    super('An operation needs state the source has not fetched.', {
      metaMessages: [
        'This EVM reads through an asynchronous database; await the operation.',
      ],
    })
  }
}
