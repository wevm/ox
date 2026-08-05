import type * as Address from '../core/Address.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type * as async from './internal/async.js'
import type * as internal from './internal/database.js'

/**
 * State an EVM reads through.
 *
 * A database answers reads and nothing else. Writes accumulate inside the EVM,
 * never reaching back through this boundary, so a source can be a plain object
 * over local state or a view onto a remote node.
 *
 * Reads are synchronous here. Asynchronous sources arrive with a separate type.
 */
export type Database = internal.Database

/** An account, as a database reports it. */
export type Account = internal.Account

/**
 * State an EVM reads through, asynchronously.
 *
 * The same reads {@link ox#Database.(Database:type)} serves, returning promises.
 * An EVM created over one of these performs its reads asynchronously, so
 * executing through it returns a promise.
 */
export type Async = async.Marked

/**
 * Creates an in-memory database.
 *
 * Code is supplied inline with each account, so
 * {@link ox#Database.(Database:type)}`.getCodeByHash` is never reached: the
 * engine files inline code under its hash when it loads the account.
 *
 * @example
 * ```ts twoslash
 * import { Database } from 'ox/evm'
 *
 * const database = Database.fromMemory({
 *   accounts: {
 *     '0x0000000000000000000000000000000000000001': {
 *       balance: 1n
 *     },
 *     '0x0000000000000000000000000000000000000002': {
 *       code: '0x5f5ff3'
 *     }
 *   }
 * })
 * ```
 *
 * @param options - Initial state.
 * @returns An in-memory database.
 */
export function fromMemory(options: fromMemory.Options = {}): Database {
  type Entry = {
    balance: bigint
    code: Bytes.Bytes | undefined
    codeHash: Hex.Hex
    nonce: bigint
    storage: Map<bigint, bigint>
  }

  const emptyCodeHash = Hash.keccak256('0x')
  const accounts = new Map<string, Entry>()
  for (const [address, account] of Object.entries(options.accounts ?? {})) {
    // Copied, not referenced: `Bytes.from` hands back a caller's own array, and
    // mutating it later would change the code while `codeHash` stayed stale.
    const code = account.code
      ? Uint8Array.from(Bytes.from(account.code))
      : undefined
    if (code) assertCode(address, code)
    accounts.set(address.toLowerCase(), {
      balance: account.balance ?? 0n,
      code,
      codeHash: code ? Hash.keccak256(Hex.fromBytes(code)) : emptyCodeHash,
      nonce: account.nonce ?? 0n,
      storage: new Map(
        Object.entries(account.storage ?? {}).map(([slot, value]) => [
          BigInt(slot),
          value,
        ]),
      ),
    })
  }

  const blockHashes = new Map(
    Object.entries(options.blockHashes ?? {}).map(([number, value]) => [
      BigInt(number),
      value,
    ]),
  )

  return {
    getAccount(address) {
      const account = accounts.get(address.toLowerCase())
      if (!account) return undefined
      return {
        balance: account.balance,
        // Copied on the way out too: handing back the stored array would let a
        // caller change the executed code while `codeHash` stayed committed.
        code: account.code ? Uint8Array.from(account.code) : undefined,
        codeHash: account.codeHash,
        nonce: account.nonce,
      }
    },
    getBlockHash(number) {
      // evm2 range-checks `BLOCKHASH` before asking, so a number reaching here
      // is one the chain has and this database is missing.
      const blockHash = blockHashes.get(number)
      if (!blockHash) throw new MissingBlockHashError({ number })
      return blockHash
    },
    getCodeByHash(codeHash) {
      for (const account of accounts.values())
        if (
          account.code &&
          account.codeHash.toLowerCase() === codeHash.toLowerCase()
        )
          return Uint8Array.from(account.code)
      return new Uint8Array()
    },
    getStorage(address, key) {
      return accounts.get(address.toLowerCase())?.storage.get(key) ?? 0n
    },
  }
}

export declare namespace fromMemory {
  type Options = {
    /** Accounts to seed, keyed by address. */
    accounts?:
      | Record<
          Address.Address | (string & {}),
          {
            /** Balance in wei. @default 0n */
            balance?: bigint | undefined
            /** Deployed code. @default '0x' */
            code?: Hex.Hex | Bytes.Bytes | undefined
            /** Nonce. @default 0n */
            nonce?: bigint | undefined
            /** Storage slots, keyed by slot. */
            storage?: Record<string, bigint> | undefined
          }
        >
      | undefined
    /**
     * Historical block hashes, keyed by block number. A `BLOCKHASH` for a
     * height inside the window but absent here fails the read.
     */
    blockHashes?: Record<string, Hex.Hex> | undefined
  }
}

/**
 * Marks a source as asynchronous.
 *
 * An EVM created over the result performs its reads asynchronously, so executing
 * through it returns a promise. Marking is explicit because whether a read
 * returns a promise is otherwise only knowable by performing one.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Database, Evm } from 'ox/evm'
 *
 * const database = Database.fromAsync({
 *   async getAccount(address) {
 *     return load(address)
 *   },
 *   async getBlockHash(number) {
 *     return hashes[String(number)]
 *   },
 *   async getCodeByHash(codeHash) {
 *     return code[codeHash]
 *   },
 *   async getStorage(address, key) {
 *     return slots[`${address}:${key}`] ?? 0n
 *   }
 * })
 * ```
 *
 * @param source - Reads to perform.
 * @returns An asynchronous database.
 */
export function fromAsync(source: async.Async): Async {
  return { ...source, '~async': true }
}

/**
 * Creates an asynchronous database over a JSON-RPC endpoint.
 *
 * Reads resolve at `blockNumber`, so pin it for a reproducible fork. An account
 * read needs balance, nonce, and code, which go out as one batched request
 * rather than three round trips.
 *
 * For a source that is not an HTTP endpoint, implement the reads and mark them
 * with {@link ox#Database.(fromAsync:function)}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Database, Evm } from 'ox/evm'
 *
 * const fork = await Evm.create({
 *   database: Database.fromRpc('https://eth.example.com', {
 *     blockNumber: 19868020n
 *   })
 * })
 *
 * // Reads are asynchronous, so execution is too.
 * const result = await Evm.callTx(fork, transaction)
 * ```
 *
 * @param url - JSON-RPC endpoint.
 * @param options - Read options.
 * @returns An asynchronous database.
 */
export function fromRpc(url: string, options: fromRpc.Options = {}): Async {
  const { blockNumber, fetchFn = fetch, timeout = 10_000 } = options
  const block =
    blockNumber === undefined ? 'latest' : Hex.fromNumber(blockNumber)

  let id = 0

  // Sends one JSON-RPC request, or a batch, and returns results in order.
  async function send(
    calls: readonly { method: string; params: readonly unknown[] }[],
  ) {
    const body = calls.map((call) => ({ ...call, id: id++, jsonrpc: '2.0' }))
    const response = await fetchFn(url, {
      body: JSON.stringify(body.length === 1 ? body[0] : body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(timeout),
    })
    if (!response.ok) throw new RpcError({ status: response.status, url })

    const parsed = await response.json()
    // A single-element batch is sent unwrapped, so the reply is too.
    const results = Array.isArray(parsed) ? parsed : [parsed]

    // A batch may answer out of order, so replies are matched by id.
    const byId = new Map(results.map((entry) => [entry.id, entry]))
    return body.map(({ id: sent, method }) => {
      const entry = byId.get(sent)
      if (!entry) throw new RpcError({ method, url })
      if (entry.error)
        throw new RpcError({ message: entry.error.message, method, url })
      return entry.result
    })
  }

  return fromAsync({
    async getAccount(address) {
      const [balance, nonce, code] = (await send([
        { method: 'eth_getBalance', params: [address, block] },
        { method: 'eth_getTransactionCount', params: [address, block] },
        { method: 'eth_getCode', params: [address, block] },
      ])) as [Hex.Hex, Hex.Hex, Hex.Hex]

      // A node answers zero for an account that does not exist and for an empty
      // one that does, so both are reported absent. evm2 reads an absent account
      // as balance and nonce zero, which is the same state.
      const bytes = Bytes.fromHex(code)
      if (
        Hex.toBigInt(balance) === 0n &&
        Hex.toBigInt(nonce) === 0n &&
        bytes.length === 0
      )
        return undefined

      return {
        balance: Hex.toBigInt(balance),
        ...(bytes.length ? { code: bytes } : {}),
        codeHash: Hash.keccak256(code),
        nonce: Hex.toBigInt(nonce),
      }
    },
    async getBlockHash(number) {
      const [header] = (await send([
        {
          method: 'eth_getBlockByNumber',
          params: [Hex.fromNumber(number), false],
        },
      ])) as [{ hash: Hex.Hex } | null]
      if (!header) throw new MissingBlockHashError({ number })
      return header.hash
    },
    async getCodeByHash() {
      // Nodes key code by address, not by hash, and `getAccount` supplies it
      // inline, so the engine never reaches this.
      throw new UnsupportedReadError()
    },
    async getStorage(address, key) {
      const [value] = (await send([
        {
          method: 'eth_getStorageAt',
          params: [address, Hex.fromNumber(key), block],
        },
      ])) as [Hex.Hex]
      return Hex.toBigInt(value)
    },
  })
}

export declare namespace fromRpc {
  type Options = {
    /** Block to read at. Latest when omitted, which is not reproducible. */
    blockNumber?: bigint | undefined
    /** Replaces the request implementation. Recording and replay use this. */
    fetchFn?: typeof fetch | undefined
    /** Milliseconds before a request aborts. @default 10_000 */
    timeout?: number | undefined
  }
}

// Rejects code the engine would refuse to classify. `0xef01`-prefixed code is an
// EIP-7702 delegation designator: exactly 23 bytes with a zero version byte.
// Checking here fails at the account that declared it rather than as an opaque
// read failure during execution.
function assertCode(address: string, code: Bytes.Bytes) {
  if (code[0] !== 0xef || code[1] !== 0x01) return
  if (code.length === 23 && code[2] === 0x00) return
  throw new InvalidDesignatorError({ address, length: code.length })
}

/** Thrown when a JSON-RPC endpoint did not answer a read. */
export class RpcError extends Errors.BaseError {
  override readonly name = 'Database.RpcError'

  constructor(options: {
    message?: string | undefined
    method?: string | undefined
    status?: number | undefined
    url: string
  }) {
    super('A JSON-RPC read failed.', {
      metaMessages: [
        `Endpoint: ${options.url}`,
        ...(options.method ? [`Method: ${options.method}`] : []),
        ...(options.status ? [`Status: ${options.status}`] : []),
        ...(options.message ? [options.message] : []),
      ],
    })
  }
}

/** Thrown when a source cannot serve a read the engine performed. */
export class UnsupportedReadError extends Errors.BaseError {
  override readonly name = 'Database.UnsupportedReadError'

  constructor() {
    super('This source cannot look code up by its hash.', {
      metaMessages: [
        'Nodes key code by address, so the account read supplies it inline.',
      ],
    })
  }
}

/** Thrown when an account's delegation designator is malformed. */
export class InvalidDesignatorError extends Errors.BaseError {
  override readonly name = 'Database.InvalidDesignatorError'

  constructor({ address, length }: { address: string; length: number }) {
    super('An account declared a malformed delegation designator.', {
      metaMessages: [
        `Account: ${address}`,
        `Length: ${length} bytes, expected 23`,
        'Code beginning `0xef01` is an EIP-7702 designator: `0xef0100` and a 20-byte address.',
      ],
    })
  }
}

/** Thrown when a `BLOCKHASH` the chain retains was never seeded. */
export class MissingBlockHashError extends Errors.BaseError {
  override readonly name = 'Database.MissingBlockHashError'

  constructor({ number }: { number: bigint }) {
    super('The database has no hash for a block the chain retains.', {
      metaMessages: [
        `Block: ${number}`,
        'Seed it through `blockHashes` to execute this transaction.',
      ],
    })
  }
}
