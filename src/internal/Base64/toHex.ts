import type { Errors } from '../../Errors.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
import type { Hex } from '../Hex/types.js'
import { Base64_toBytes } from './toBytes.js'

/**
 * Decodes a Base64-encoded string (with optional padding and/or URL-safe characters) to {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Base64, Hex } from 'ox'
 *
 * const value = Base64.toHex('aGVsbG8gd29ybGQ=')
 * // @log: 0x68656c6c6f20776f726c64
 * ```
 *
 * @param value - The string, hex value, or byte array to encode.
 * @returns The Base64 decoded {@link ox#Hex.Hex}.
 */
export function Base64_toHex(value: string): Hex {
  return Hex_fromBytes(Base64_toBytes(value))
}

export declare namespace Base64_toHex {
  type ErrorType = Base64_toBytes.ErrorType | Errors.GlobalErrorType
}

Base64_toHex.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base64_toHex.ErrorType
