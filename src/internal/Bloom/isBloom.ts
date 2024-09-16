import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_isHex } from '../Hex/isHex.js'
import { Hex_size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'

/**
 * Checks if a string is a valid bloom filter value.
 *
 * @example
 * ```ts twoslash
 * import { Bloom } from 'ox'
 *
 * Bloom.isBloom('0x')
 * // @log: false
 *
 * Bloom.isBloom('0x00000000000000000000008000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000044000200000000000000000002000000000000000000000040000000000000000000000000000020000000000000000000800000000000800000000000800000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000808002000000000400000000000000000000000060000000000000000000000000000000000000000000000100000000000002000000')
 * // @log: true
 * ```
 *
 * @param value - Value to check.
 * @returns Whether the value is a valid bloom filter.
 */
export function Bloom_isBloom(value: string): value is Hex {
  return Hex_isHex(value) && Hex_size(value) === 256
}

export declare namespace Bloom_isBloom {
  type ErrorType = Hex_isHex.ErrorType | Hex_size.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Bloom_isBloom.parseError = (error: unknown) => error as Bloom_isBloom.ErrorType
