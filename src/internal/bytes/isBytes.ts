import type { Bytes } from '../bytes/types.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Bytes_assert } from './assert.js'

/**
 * Checks if the given value is {@link Bytes#Bytes}.
 *
 * - Docs: https://oxlib.sh/api/bytes/isBytes
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.isBytes('0x') // false
 * Bytes.isBytes(Bytes.from([1, 2, 3])) // true
 * ```
 */
export function Bytes_isBytes(value: unknown): value is Bytes {
  try {
    Bytes_assert(value)
    return true
  } catch {
    return false
  }
}

export declare namespace Bytes_isBytes {
  export type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Bytes_isBytes.parseError = (error: unknown) => error as Bytes_isBytes.ErrorType
