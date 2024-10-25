import type * as Errors from '../../Errors.js'
import { Hex_assertSize } from './assertSize.js'
import { Hex_padLeft } from './pad.js'
import type { Hex } from './types.js'

/**
 * Encodes a boolean into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.fromBoolean(true)
 * // @log: '0x1'
 *
 * Hex.fromBoolean(false)
 * // @log: '0x0'
 *
 * Hex.fromBoolean(true, { size: 32 })
 * // @log: '0x0000000000000000000000000000000000000000000000000000000000000001'
 * ```
 *
 * @param value - The boolean value to encode.
 * @param options -
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function Hex_fromBoolean(
  value: boolean,
  options: Hex_fromBoolean.Options = {},
): Hex {
  const hex: Hex = `0x0${Number(value)}`
  if (typeof options.size === 'number') {
    Hex_assertSize(hex, options.size)
    return Hex_padLeft(hex, options.size)
  }
  return hex
}

export declare namespace Hex_fromBoolean {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex_assertSize.ErrorType
    | Hex_padLeft.ErrorType
    | Errors.GlobalErrorType
}

Hex_fromBoolean.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Hex_fromBoolean.ErrorType
