import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_isHex } from '../Hex/isHex.js'
import { Hex_size } from '../Hex/size.js'
import type { Hex } from '../Hex/types.js'

/**
 * Checks if a string is a valid hash value.
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.isHash('0x')
 * // @log: false
 *
 * Hash.isHash('0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0')
 * // @log: true
 * ```
 *
 * @param value - Value to check.
 * @returns Whether the value is a valid hash.
 */
export function Hash_isHash(value: string): value is Hex {
  return Hex_isHex(value) && Hex_size(value) === 32
}

export declare namespace Hash_isHash {
  type ErrorType = Hex_isHex.ErrorType | Hex_size.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Hash_isHash.parseError = (error: unknown) => error as Hash_isHash.ErrorType
