import type { Bytes } from './types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Bytes_assert } from './assert.js'

/**
 * Checks if the given value is {@link Bytes#Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.isBytes('0x')
 * // @log: false
 *
 * Bytes.isBytes(Bytes.from([1, 2, 3]))
 * // @log: true
 * ```
 *
 * @param value - Value to check.
 * @returns `true` if the value is {@link Bytes#Bytes}, otherwise `false`.
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
