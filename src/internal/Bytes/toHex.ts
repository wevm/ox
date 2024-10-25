import type * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

/**
 * Encodes a {@link ox#Bytes.Bytes} value into a {@link ox#Hex.Hex} value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.toHex(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
 * // '0x48656c6c6f20576f726c6421'
 * ```
 *
 * @param bytes - The {@link ox#Bytes.Bytes} to decode.
 * @param options -
 * @returns Decoded {@link ox#Hex.Hex} value.
 */
export function toHex(
  value: Bytes.Bytes,
  options: Bytes.toHex.Options = {},
): Hex.Hex {
  return Hex.fromBytes(value, options)
}

export declare namespace toHex {
  type Options = {
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType = Hex.fromBytes.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
toHex.parseError = (error: unknown) => error as Bytes.toHex.ErrorType
