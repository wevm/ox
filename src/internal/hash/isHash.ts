import type { GlobalErrorType } from '../errors/error.js'
import { Hex_isHex } from '../hex/isHex.js'
import { Hex_size } from '../hex/size.js'
import type { Hex } from '../types/data.js'

/**
 * Checks if a string is a valid hash value.
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.isHash('0x')
 * // false
 *
 * Hash.isHash('0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0')
 * // true
 * ```
 */
export function Hash_isHash(hash: string): hash is Hex {
  return Hex_isHex(hash) && Hex_size(hash) === 32
}

export declare namespace Hash_isHash {
  type ErrorType = Hex_isHex.ErrorType | Hex_size.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Hash_isHash.parseError = (error: unknown) => error as Hash_isHash.ErrorType
