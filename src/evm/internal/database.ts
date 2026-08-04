import type * as Address from '../../core/Address.js'
import * as Bytes from '../../core/Bytes.js'
import * as Errors from '../../core/Errors.js'
import * as Hex from '../../core/Hex.js'
import * as codec from './codec.js'

/**
 * JavaScript side of evm2's synchronous `Database` boundary.
 *
 * The callbacks supply external values and nothing more: caching, journaling,
 * and rollback stay inside evm2. A read a source cannot serve throws, and the
 * engine reports the failure once execution has unwound.
 *
 * @internal
 */

/** Account fields the engine reads. */
export type Account = {
  /** Balance in wei. */
  balance: bigint
  /**
   * The account's code, when the source already holds it.
   *
   * evm2 accepts code alongside the account and files it under its hash, so
   * supplying it here means {@link Database.getCodeByHash} is never called for
   * this account. That matters for a source keyed by address: JSON-RPC exposes
   * `eth_getCode(address)` and nothing that looks code up by hash.
   */
  code?: Bytes.Bytes | undefined
  /** Hash of the account's code, or the empty code hash. */
  codeHash: Hex.Hex
  /** Nonce. */
  nonce: bigint
}

/** Synchronous state reads the engine calls back into. */
export type Database = {
  /** Reads an account, or `undefined` when it does not exist. */
  getAccount(address: Address.Address): Account | undefined
  /**
   * Reads a historical block hash.
   *
   * evm2 only asks for numbers inside the `BLOCKHASH` window, so a hash the
   * source cannot provide is a failure rather than a miss.
   */
  getBlockHash(number: bigint): Hex.Hex
  /**
   * Reads code by its hash.
   *
   * Only called for accounts whose {@link Account.code} was not supplied.
   */
  getCodeByHash(codeHash: Hex.Hex): Bytes.Bytes
  /** Reads a persistent storage slot, or `0n` when unset. */
  getStorage(address: Address.Address, key: bigint): bigint
}

/**
 * Encoded account size: `balance` (32 BE), `nonce` (8 LE), `code_hash` (32),
 * `has_code` (1).
 */
const accountSize = 73

/**
 * Checks a value a source returned fits the width the ABI encodes it at.
 *
 * `Bytes.fromNumber` already rejects an out-of-range balance or storage slot,
 * but the nonce is written by hand and `Bytes.fromHex` right-pads a short hash
 * instead of rejecting it. Truncating a nonce or padding a hash would present
 * evm2 with different state than the source supplied.
 */
function u64(field: string, value: bigint) {
  if (value < 0n || value > 0xff_ff_ff_ff_ff_ff_ff_ffn)
    throw new codec.EncodeError({
      max: '18446744073709551615',
      value: `${field} ${value}`,
    })
  return value
}

function hash(field: string, value: Hex.Hex) {
  const bytes = Bytes.fromHex(value)
  if (bytes.length !== 32)
    throw new codec.EncodeError({
      max: '32 bytes',
      value: `${field} ${bytes.length} bytes`,
    })
  return bytes
}

const found = 0
const missing = 1
const failed = 2
/** Code did not fit; the length written back tells the engine what to grow to. */
const tooLarge = 3

/** Host import table, bound to one engine instance. */
export type Host = {
  /** Binds the memory the imports address. Called once, after instantiation. */
  attach(memory: WebAssembly.Memory): void
  /** Import object passed to `WebAssembly.instantiate`. */
  imports: WebAssembly.Imports
  /** Takes the failure a read recorded, if any. */
  takeFailure(): Error | undefined
}

/**
 * Builds the `ox_evm2` import table over `database`.
 *
 * A callback that throws does not unwind through WebAssembly: the failure is
 * recorded, the import returns a failure status, evm2 aborts the transaction
 * without accepting state, and the caller rethrows once control is back in
 * JavaScript.
 */
export function host(database: Database): Host {
  let failure: Error | undefined
  let memory: WebAssembly.Memory | undefined

  /**
   * Bounds a span against linear memory and returns the current view.
   *
   * The view is taken per call rather than cached: growing memory detaches the
   * previous `ArrayBuffer`, which silently turns a retained view into an empty
   * one.
   */
  function span(pointer: number, length: number) {
    if (!memory) throw new UnattachedError()
    const bytes = new Uint8Array(memory.buffer)
    if (pointer < 0 || length < 0 || pointer + length > bytes.length)
      throw new BoundsError({ length, limit: bytes.length, pointer })
    return bytes
  }

  /** Runs a read, turning a throw into a recorded failure status. */
  function guard(read: () => number) {
    try {
      return read()
    } catch (error) {
      failure ??= error as Error
      return failed
    }
  }

  function address(pointer: number) {
    const bytes = span(pointer, 20)
    return Hex.fromBytes(
      bytes.subarray(pointer, pointer + 20),
    ) as Address.Address
  }

  /** Writes a little-endian `u32` the engine reads a length from. */
  function count(pointer: number, value: number) {
    const bytes = span(pointer, 4)
    for (let index = 0; index < 4; index++)
      bytes[pointer + index] = (value >>> (index * 8)) & 0xff
  }

  function word(pointer: number) {
    const bytes = span(pointer, 32)
    return Bytes.toBigInt(bytes.subarray(pointer, pointer + 32))
  }

  return {
    attach(value) {
      memory = value
    },
    imports: {
      ox_evm2: {
        get_account: (
          pointer: number,
          out: number,
          code: number,
          capacity: number,
          length: number,
        ) =>
          guard(() => {
            const account = database.getAccount(address(pointer))
            if (!account) return missing
            const nonce = u64('nonce', account.nonce)
            const codeHash = hash('codeHash', account.codeHash)

            // Report the length first, so the engine grows and retries before
            // anything is written.
            if (account.code && account.code.length > capacity) {
              count(length, account.code.length)
              return tooLarge
            }

            const bytes = span(out, accountSize)
            bytes.set(Bytes.fromNumber(account.balance, { size: 32 }), out)
            for (let index = 0; index < 8; index++)
              bytes[out + 32 + index] = Number(
                (nonce >> BigInt(index * 8)) & 0xffn,
              )
            bytes.set(codeHash, out + 40)
            bytes[out + 72] = account.code ? 1 : 0

            if (account.code) {
              span(code, account.code.length).set(account.code, code)
              count(length, account.code.length)
            }
            return found
          }),
        get_block_hash: (pointer: number, out: number) =>
          guard(() => {
            const blockHash = hash(
              'blockHash',
              database.getBlockHash(word(pointer)),
            )
            span(out, 32).set(blockHash, out)
            return found
          }),
        get_code_by_hash: (
          pointer: number,
          out: number,
          capacity: number,
          length: number,
        ) =>
          guard(() => {
            const bytes = span(pointer, 32)
            const code = database.getCodeByHash(
              Hex.fromBytes(bytes.subarray(pointer, pointer + 32)),
            )
            // Reporting the required length lets the engine grow once and retry,
            // so code larger than the current fork's deployment limit still
            // loads.
            if (code.length > capacity) {
              count(length, code.length)
              return tooLarge
            }
            span(out, code.length).set(code, out)
            count(length, code.length)
            return found
          }),
        get_storage: (pointer: number, key: number, out: number) =>
          guard(() => {
            const value = database.getStorage(address(pointer), word(key))
            span(out, 32).set(Bytes.fromNumber(value, { size: 32 }), out)
            return found
          }),
      },
    },
    takeFailure() {
      const recorded = failure
      failure = undefined
      return recorded
    },
  }
}

/** Thrown when a host read runs before its memory was attached. */
export class UnattachedError extends Errors.BaseError {
  override readonly name = 'Evm.UnattachedError'

  constructor() {
    super('The evm2 engine called a host read before its memory was attached.')
  }
}

/** Thrown when the engine asks a host read to address memory outside its own. */
export class BoundsError extends Errors.BaseError {
  override readonly name = 'Evm.BoundsError'

  constructor({
    length,
    limit,
    pointer,
  }: {
    length: number
    limit: number
    pointer: number
  }) {
    super('The evm2 engine addressed memory outside its own.', {
      metaMessages: [
        `Requested: ${length} bytes at ${pointer}`,
        `Available: ${limit} bytes`,
      ],
    })
  }
}

/** Thrown when a source returns code the engine's landing buffer cannot hold. */
export class CodeTooLargeError extends Errors.BaseError {
  override readonly name = 'Evm.CodeTooLargeError'

  constructor({ capacity, length }: { capacity: number; length: number }) {
    super('The state source returned more code than the engine accepts.', {
      metaMessages: [`Returned: ${length} bytes`, `Maximum: ${capacity} bytes`],
    })
  }
}
