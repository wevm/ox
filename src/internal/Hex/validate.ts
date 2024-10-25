import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

/**
 * Checks if the given value is {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes, Hex } from 'ox'
 *
 * Hex.validate('0xdeadbeef')
 * // @log: true
 *
 * Hex.validate(Bytes.from([1, 2, 3]))
 * // @log: false
 * ```
 *
 * @param value - The value to check.
 * @param options -
 * @returns `true` if the value is a {@link ox#Hex.Hex}, `false` otherwise.
 */
export function validate(
  value: unknown,
  options: Hex.validate.Options = {},
): value is Hex.Hex {
  const { strict = true } = options
  try {
    Hex.assert(value, { strict })
    return true
  } catch {
    return false
  }
}

export declare namespace validate {
  type Options = {
    /** Checks if the {@link ox#Hex.Hex} value contains invalid hexadecimal characters. @default true */
    strict?: boolean | undefined
  }

  type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
validate.parseError = (error: unknown) => error as Hex.validate.ErrorType
