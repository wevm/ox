import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from './fromBytes.js'
import type { Hex } from './types.js'

const encoder = /*#__PURE__*/ new TextEncoder()

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
 * @param options - Options.
 * @returns The encoded {@link ox#Hex.Hex} value.
 */
export function Hex_fromString(
  value: string,
  options: Hex_fromString.Options = {},
): Hex {
  return Hex_fromBytes(encoder.encode(value), options)
}

export declare namespace Hex_fromString {
  type Options = {
    /** The size (in bytes) of the output hex value. */
    size?: number | undefined
  }

  type ErrorType = Hex_fromBytes.ErrorType | GlobalErrorType
}

Hex_fromString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Hex_fromString.ErrorType
