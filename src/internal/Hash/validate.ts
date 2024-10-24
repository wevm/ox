import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

/**
 * Checks if a string is a valid hash value.
 *
 * @example
 * ```ts twoslash
 * import { Hash } from 'ox'
 *
 * Hash.validate('0x')
 * // @log: false
 *
 * Hash.validate('0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0')
 * // @log: true
 * ```
 *
 * @param value - Value to check.
 * @returns Whether the value is a valid hash.
 */
export function validate(value: string): value is Hex.Hex {
  return Hex.validate(value) && Hex.size(value) === 32
}

export declare namespace validate {
  type ErrorType =
    | Hex.validate.ErrorType
    | Hex.size.ErrorType
    | Errors.GlobalErrorType
}

/* v8 ignore next */
validate.parseError = (error: unknown) => error as validate.ErrorType
