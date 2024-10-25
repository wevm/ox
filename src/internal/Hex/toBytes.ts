import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'

/**
 * Decodes a {@link ox#Hex.Hex} value into a {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * const data = Hex.toBytes('0x48656c6c6f20776f726c6421')
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33])
 * ```
 *
 * @param hex - The {@link ox#Hex.Hex} value to decode.
 * @param options -
 * @returns The decoded {@link ox#Bytes.Bytes}.
 */
export function toBytes(
  hex: Hex.Hex,
  options: Hex.toBytes.Options = {},
): Bytes.Bytes {
  return Bytes.fromHex(hex, options)
}

export declare namespace toBytes {
  type Options = {
    /** Size (in bytes) of the hex value. */
    size?: number | undefined
  }

  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
toBytes.parseError = (error: unknown) => error as Hex.toBytes.ErrorType
