import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import { assertSize } from './assertSize.js'

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
export function fromBoolean(
  value: boolean,
  options: Hex.fromBoolean.Options = {},
): Hex.Hex {
  const hex: Hex.Hex = `0x0${Number(value)}`
  if (typeof options.size === 'number') {
    assertSize(hex, options.size)
    return Hex.padLeft(hex, options.size)
  }
  return hex
}

export declare namespace fromBoolean {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType =
    | assertSize.ErrorType
    | Hex.padLeft.ErrorType
    | Errors.GlobalErrorType
}

fromBoolean.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Hex.fromBoolean.ErrorType
