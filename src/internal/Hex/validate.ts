import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_assert } from './assert.js'
import type { Hex } from './types.js'

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
export function Hex_validate(
  value: unknown,
  options: Hex_validate.Options = {},
): value is Hex {
  const { strict = true } = options
  try {
    Hex_assert(value, { strict })
    return true
  } catch {
    return false
  }
}

export declare namespace Hex_validate {
  type Options = {
    /** Checks if the {@link ox#Hex.Hex} value contains invalid hexadecimal characters. @default true */
    strict?: boolean | undefined
  }

  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Hex_validate.parseError = (error: unknown) => error as Hex_validate.ErrorType
