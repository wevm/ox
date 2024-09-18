import { Bytes_fromHex } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hash_keccak256 } from '../Hash/keccak256.js'
import type { Hex } from '../Hex/types.js'

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
export function Bloom_contains(bloom: Hex, input: Hex | Bytes): boolean {
  const filter = Bytes_fromHex(bloom)
  const hash = Hash_keccak256(input, 'Bytes')

  for (const i of [0, 2, 4]) {
    const bit = (hash[i + 1]! + (hash[i]! << 8)) & 0x7ff
    if ((filter[256 - 1 - Math.floor(bit / 8)]! & (1 << (bit % 8))) === 0)
      return false
  }

  return true
}

export declare namespace Bloom_contains {
  type ErrorType =
    | Bytes_fromHex.ErrorType
    | Hash_keccak256.ErrorType
    | GlobalErrorType
}

Bloom_contains.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bloom_contains.ErrorType
