import type { Errors } from '../../Errors.js'
import { Hex_size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'
import { Hex_validate } from '../Hex/validate.js'

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
export function Bloom_validate(value: string): value is Hex {
  return Hex_validate(value) && Hex_size(value) === 256
}

export declare namespace Bloom_validate {
  type ErrorType =
    | Hex_validate.ErrorType
    | Hex_size.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
Bloom_validate.parseError = (error: unknown) =>
  error as Bloom_validate.ErrorType
