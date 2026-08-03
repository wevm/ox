import type * as Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'

/** Read result from a source: synchronous sources return plain values; an
 * asynchronous source may return either (a cache hit stays synchronous). */
export type Value<
  asynchronous extends boolean,
  type,
> = asynchronous extends true ? type | Promise<type> : type

/** An account, as a source reports it. `code` may be omitted and resolved
 * lazily via {@link ox#evm/EvmState.(Source:type)}`.getCode`. */
export type Account = Compute<{
  /** Balance in wei. */
  balance: bigint
  /** Nonce. */
  nonce: bigint
  /** Deployed code. */
  code?: Hex.Hex | undefined
}>

/**
 * Root type — a pluggable state source.
 *
 * Reads follow `async`; writes are always synchronous, landing in the
 * source's local overlay (a fork source never writes upstream).
 */
export type Source<asynchronous extends boolean = boolean> = {
  /** Type- and runtime-level discriminant for read asynchrony. */
  async: asynchronous
  getAccount(address: Address.Address): Value<asynchronous, Account | undefined>
  getBlockHash(number: bigint): Value<asynchronous, Hex.Hex>
  getCode(address: Address.Address): Value<asynchronous, Hex.Hex>
  getStorage(
    address: Address.Address,
    slot: bigint,
  ): Value<asynchronous, bigint>
  putAccount(address: Address.Address, account: Account | undefined): void
  putStorage(address: Address.Address, slot: bigint, value: bigint): void
}

/** A synchronous source. */
export type Sync = Source<false>

/** An asynchronous source. */
export type Async = Source<true>

/** In-memory source returned by {@link ox#evm/EvmState.(fromMemory:function)}. */
export type Memory = Compute<Sync>

const zeroHash = `0x${'00'.repeat(32)}` as const

/**
 * Instantiates an in-memory state source.
 *
 * @example
 * ```ts twoslash
 * import { EvmState } from 'ox/evm'
 *
 * const state = EvmState.fromMemory({
 *   accounts: {
 *     '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357': {
 *       balance: 10n ** 18n,
 *       storage: { '0x01': '0x2a' }
 *     }
 *   }
 * })
 *
 * state.getStorage(
 *   '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357',
 *   1n
 * )
 * // @log: 42n
 * ```
 *
 * @param options - Options.
 * @returns An in-memory source.
 */
export function fromMemory(options: fromMemory.Options = {}): Memory {
  const accounts = new Map<
    string,
    { balance: bigint; code: Hex.Hex; nonce: bigint }
  >()
  const storage = new Map<string, Map<bigint, bigint>>()
  const blockHashes = new Map<bigint, Hex.Hex>()

  for (const [key, init] of Object.entries(options.accounts ?? {})) {
    const address = key.toLowerCase()
    accounts.set(address, {
      balance: init.balance ?? 0n,
      code: init.code ?? '0x',
      nonce: init.nonce ?? 0n,
    })
    if (init.storage) {
      const slots = new Map<bigint, bigint>()
      for (const [slot, value] of Object.entries(init.storage))
        slots.set(Hex.toBigInt(slot as Hex.Hex), Hex.toBigInt(value))
      storage.set(address, slots)
    }
  }
  for (const [number, hash] of Object.entries(options.blockHashes ?? {}))
    blockHashes.set(BigInt(number), hash)

  return {
    async: false,
    getAccount(address) {
      const account = accounts.get(address.toLowerCase())
      if (!account) return undefined
      return {
        balance: account.balance,
        code: account.code,
        nonce: account.nonce,
      }
    },
    getBlockHash(number) {
      return blockHashes.get(number) ?? zeroHash
    },
    getCode(address) {
      return accounts.get(address.toLowerCase())?.code ?? '0x'
    },
    getStorage(address, slot) {
      return storage.get(address.toLowerCase())?.get(slot) ?? 0n
    },
    putAccount(address, account) {
      const key = address.toLowerCase()
      if (account === undefined) {
        accounts.delete(key)
        storage.delete(key)
        return
      }
      accounts.set(key, {
        balance: account.balance,
        code: account.code ?? accounts.get(key)?.code ?? '0x',
        nonce: account.nonce,
      })
    },
    putStorage(address, slot, value) {
      const key = address.toLowerCase()
      let slots = storage.get(key)
      if (!slots) {
        slots = new Map()
        storage.set(key, slots)
      }
      slots.set(slot, value)
    },
  }
}

export declare namespace fromMemory {
  type AccountInit = {
    /** Balance in wei. @default 0n */
    balance?: bigint | undefined
    /** Deployed code. @default '0x' */
    code?: Hex.Hex | undefined
    /** Nonce. @default 0n */
    nonce?: bigint | undefined
    /** Storage slots, hex slot to hex value. */
    storage?: Record<Hex.Hex, Hex.Hex> | undefined
  }

  type Options = {
    /** Accounts to seed. */
    accounts?: Record<Address.Address, AccountInit> | undefined
    /** Ancestor block hashes, number to hash, for `BLOCKHASH`. */
    blockHashes?: Record<number, Hex.Hex> | undefined
  }

  type ErrorType = Hex.toBigInt.ErrorType | Errors.GlobalErrorType
}

/**
 * Asserts that a value is a well-formed {@link ox#evm/EvmState.(Source:type)}.
 *
 * @example
 * ```ts twoslash
 * import { EvmState } from 'ox/evm'
 *
 * const source = EvmState.from(EvmState.fromMemory())
 * ```
 *
 * @param source - Source to validate.
 * @returns The source.
 */
export function from<const source extends Source>(source: source): source {
  for (const method of [
    'getAccount',
    'getBlockHash',
    'getCode',
    'getStorage',
    'putAccount',
    'putStorage',
  ] as const)
    if (typeof source[method] !== 'function')
      throw new InvalidSourceError({ property: method })
  if (typeof source.async !== 'boolean')
    throw new InvalidSourceError({ property: 'async' })
  return source
}

export declare namespace from {
  type ErrorType = InvalidSourceError | Errors.GlobalErrorType
}

/** Thrown when a state source is missing part of the contract. */
export class InvalidSourceError extends Errors.BaseError {
  override readonly name = 'EvmState.InvalidSourceError'

  constructor({ property }: { property: string }) {
    super(`\`${property}\` is missing or mistyped on the state source.`)
  }
}
