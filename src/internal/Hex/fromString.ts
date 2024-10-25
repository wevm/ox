import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

/**
 * Encodes a string into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 * Hex.fromString('Hello World!')
 * // '0x48656c6c6f20576f726c6421'
 *
 * Hex.fromString('Hello World!', { size: 32 })
 * // '0x48656c6c6f20576f726c64210000000000000000000000000000000000000000'
 * ```
 *
 * @param value - The string value to encode.
 * @param options -
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function fromString(
  value: string,
  options: Hex.fromString.Options = {},
): Hex.Hex {
  return Hex.fromBytes(encoder.encode(value), options)
}

export declare namespace fromString {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType = Hex.fromBytes.ErrorType | Errors.GlobalErrorType
}

fromString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Hex.fromString.ErrorType

const encoder = /*#__PURE__*/ new TextEncoder()
