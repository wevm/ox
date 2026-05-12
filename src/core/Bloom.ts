import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hash from './Hash.js'
import * as Hex from './Hex.js'

/**
 * Checks if an input is matched in the bloom filter.
 *
 * @example
 * ```ts twoslash
 * import { Bloom } from 'ox'
 *
 * Bloom.contains(
 *   '0x00000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002020000000000000000000000000000000000000000000008000000001000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
 *   '0xef2d6d194084c2de36e0dabfce45d046b37d1106',
 * )
 * // @log: true
 * ```
 *
 * @param bloom - Bloom filter value.
 * @param input - Input to check.
 * @returns Whether the input is matched in the bloom filter.
 */
export function contains(
  bloom: Hex.Hex,
  input: Hex.Hex | Bytes.Bytes,
): boolean {
  return containsPrepared(prepare(bloom), input)
}

export declare namespace contains {
  type ErrorType =
    | Bytes.fromHex.ErrorType
    | Hash.keccak256.ErrorType
    | InvalidBloomError
    | Errors.GlobalErrorType
}

/** Prepared bloom filter for use with {@link Bloom.containsPrepared}/{@link Bloom.containsHash}. */
export type Prepared = {
  filter: Uint8Array
}

/**
 * Prepares a bloom filter for repeated membership checks against the same filter.
 *
 * Pairs with {@link Bloom.containsPrepared} (or {@link Bloom.containsHash}) to avoid
 * the per-call hex-to-bytes conversion that {@link Bloom.contains} pays.
 *
 * @example
 * ```ts twoslash
 * import { Bloom } from 'ox'
 *
 * const prepared = Bloom.prepare(
 *   '0x00000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002020000000000000000000000000000000000000000000008000000001000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
 * )
 * Bloom.containsPrepared(prepared, '0xef2d6d194084c2de36e0dabfce45d046b37d1106')
 * // @log: true
 * ```
 *
 * @param bloom - Bloom filter value.
 * @returns A prepared bloom filter.
 */
export function prepare(bloom: Hex.Hex): Prepared {
  if (!validate(bloom)) throw new InvalidBloomError({ bloom })
  return { filter: Bytes.fromHex(bloom) }
}

export declare namespace prepare {
  type ErrorType =
    | Bytes.fromHex.ErrorType
    | InvalidBloomError
    | Errors.GlobalErrorType
}

/**
 * Checks if an input is matched in a {@link Bloom.Prepared} bloom filter.
 *
 * @example
 * ```ts twoslash
 * import { Bloom } from 'ox'
 *
 * const prepared = Bloom.prepare(
 *   '0x00000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002020000000000000000000000000000000000000000000008000000001000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
 * )
 * Bloom.containsPrepared(prepared, '0xef2d6d194084c2de36e0dabfce45d046b37d1106')
 * // @log: true
 * ```
 *
 * @param prepared - Prepared bloom filter.
 * @param input - Input to check.
 * @returns Whether the input is matched in the bloom filter.
 */
export function containsPrepared(
  prepared: Prepared,
  input: Hex.Hex | Bytes.Bytes,
): boolean {
  return containsHash(prepared, Hash.keccak256(input, { as: 'Bytes' }))
}

export declare namespace containsPrepared {
  type ErrorType = Hash.keccak256.ErrorType | Errors.GlobalErrorType
}

/**
 * Checks if a precomputed `keccak256` hash is matched in a {@link Bloom.Prepared}
 * bloom filter. Use when the caller already has the hash and wants to skip the
 * keccak inside `containsPrepared`.
 *
 * @example
 * ```ts twoslash
 * import { Bloom, Hash } from 'ox'
 *
 * const prepared = Bloom.prepare(
 *   '0x00000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002020000000000000000000000000000000000000000000008000000001000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
 * )
 * const hash = Hash.keccak256('0xef2d6d194084c2de36e0dabfce45d046b37d1106', { as: 'Bytes' })
 * Bloom.containsHash(prepared, hash)
 * // @log: true
 * ```
 *
 * @param prepared - Prepared bloom filter.
 * @param hash - Precomputed `keccak256` hash of the input, as `Bytes`.
 * @returns Whether the input is matched in the bloom filter.
 */
export function containsHash(prepared: Prepared, hash: Bytes.Bytes): boolean {
  const { filter } = prepared
  for (const i of [0, 2, 4]) {
    const bit = (hash[i + 1]! + (hash[i]! << 8)) & 0x7ff
    if ((filter[256 - 1 - Math.floor(bit / 8)]! & (1 << (bit % 8))) === 0)
      return false
  }
  return true
}

export declare namespace containsHash {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Checks if a string is a valid bloom filter value.
 *
 * @example
 * ```ts twoslash
 * import { Bloom } from 'ox'
 *
 * Bloom.validate('0x')
 * // @log: false
 *
 * Bloom.validate('0x00000000000000000000008000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000044000200000000000000000002000000000000000000000040000000000000000000000000000020000000000000000000800000000000800000000000800000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000808002000000000400000000000000000000000060000000000000000000000000000000000000000000000100000000000002000000')
 * // @log: true
 * ```
 *
 * @param value - Value to check.
 * @returns Whether the value is a valid bloom filter.
 */
export function validate(value: string): value is Hex.Hex {
  return Hex.validate(value) && Hex.size(value) === 256
}

export declare namespace validate {
  type ErrorType =
    | Hex.validate.ErrorType
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}

/** Thrown when a value is not a valid bloom filter. */
export class InvalidBloomError extends Errors.BaseError {
  override readonly name = 'Bloom.InvalidBloomError'

  constructor({ bloom }: { bloom: string }) {
    super(
      `Value \`${bloom}\` is not a valid bloom filter (must be a 256-byte hex string).`,
    )
  }
}
