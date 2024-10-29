import type { Errors } from '../../Errors.js'
import { Hex } from '../../Hex.js'
import type { Bytes } from './types.js'

/**
 * Encodes a {@link ox#Bytes.Bytes} value into a {@link ox#(Hex:type)} value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.toHex(Bytes.from([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33]))
 * // '0x48656c6c6f20576f726c6421'
 * ```
 *
 * @param value - The {@link ox#Bytes.Bytes} to decode.
 * @param options - Options.
 * @returns Decoded {@link ox#(Hex:type)} value.
 */
export function Bytes_toHex(
  value: Bytes,
  options: Bytes_toHex.Options = {},
): Hex {
  return Hex.fromBytes(value, options)
}

export declare namespace Bytes_toHex {
  type Options = {
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType = Hex.fromBytes.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
Bytes_toHex.parseError = (error: unknown) => error as Bytes_toHex.ErrorType
