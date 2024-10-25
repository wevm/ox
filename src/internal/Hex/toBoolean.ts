import type * as Errors from '../../Errors.js'
import { Hex_assertSize } from './assertSize.js'
import { Hex_InvalidHexBooleanError } from './errors.js'
import { Hex_trimLeft } from './trim.js'
import type { Hex } from './types.js'

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
export function Hex_toBoolean(
  hex: Hex,
  options: Hex_toBoolean.Options = {},
): boolean {
  let hex_ = hex
  if (options.size) {
    Hex_assertSize(hex, options.size)
    hex_ = Hex_trimLeft(hex_)
  }
  if (Hex_trimLeft(hex_) === '0x00') return false
  if (Hex_trimLeft(hex_) === '0x01') return true
  throw new Hex_InvalidHexBooleanError(hex_)
}

export declare namespace Hex_toBoolean {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex_assertSize.ErrorType
    | Hex_trimLeft.ErrorType
    | Hex_InvalidHexBooleanError
    | Errors.GlobalErrorType
}

/* v8 ignore next */
Hex_toBoolean.parseError = (error: unknown) => error as Hex_toBoolean.ErrorType
