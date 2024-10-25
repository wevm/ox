import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import { assertSize } from './assertSize.js'

/**
 * Decodes a {@link ox#Hex.Hex} value into a boolean.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.toBoolean('0x01')
 * // @log: true
 *
 * Hex.toBoolean('0x0000000000000000000000000000000000000000000000000000000000000001', { size: 32 })
 * // @log: true
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options -
 * @returns The decoded boolean.
 */
export function toBoolean(
  hex: Hex.Hex,
  options: Hex.toBoolean.Options = {},
): boolean {
  let hex_ = hex
  if (options.size) {
    assertSize(hex, options.size)
    hex_ = Hex.trimLeft(hex_)
  }
  if (Hex.trimLeft(hex_) === '0x00') return false
  if (Hex.trimLeft(hex_) === '0x01') return true
  throw new Hex.InvalidHexBooleanError(hex_)
}

export declare namespace toBoolean {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | assertSize.ErrorType
    | Hex.trimLeft.ErrorType
    | Hex.InvalidHexBooleanError
    | Errors.GlobalErrorType
}

/* v8 ignore next */
toBoolean.parseError = (error: unknown) => error as Hex.toBoolean.ErrorType
