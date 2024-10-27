import type * as Errors from '../../Errors.js'
import { Bytes_assert } from './assert.js'
import type { Bytes } from './types.js'

/**
 * Checks if the given value is {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.validate('0x')
 * // @log: false
 *
 * Bytes.validate(Bytes.from([1, 2, 3]))
 * // @log: true
 * ```
 *
 * @param value - Value to check.
 * @returns `true` if the value is {@link ox#Bytes.Bytes}, otherwise `false`.
 */
export function Bytes_validate(value: unknown): value is Bytes {
  try {
    Bytes_assert(value)
    return true
  } catch {
    return false
  }
}

export declare namespace Bytes_validate {
  export type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
Bytes_validate.parseError = (error: unknown) =>
  error as Bytes_validate.ErrorType
