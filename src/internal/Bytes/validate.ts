import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'

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
export function validate(value: unknown): value is Bytes.Bytes {
  try {
    Bytes.assert(value)
    return true
  } catch {
    return false
  }
}

export declare namespace validate {
  export type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
validate.parseError = (error: unknown) => error as Bytes.validate.ErrorType
