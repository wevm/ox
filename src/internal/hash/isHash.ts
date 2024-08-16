import { isHex } from '../data/isHex.js'
import { size } from '../data/size.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'

export declare namespace isHash {
  type ErrorType = isHex.ErrorType | size.ErrorType | GlobalErrorType
}

/**
 * Checks if a string is a valid hash value.
 *
 * @example
 * import { Hash } from 'ox'
 *
 * Hash.isHash('0x')
 * // false
 *
 * Hash.isHash('0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0')
 * // true
 */
export function isHash(hash: string): hash is Hex {
  return isHex(hash) && size(hash) === 32
}
