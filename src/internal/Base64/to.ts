import { Bytes_toString } from '../Bytes/to.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'

const encoder = /*#__PURE__*/ new TextEncoder()
const lookup = /*#__PURE__*/ {
  ...Object.fromEntries(
    Array.from(
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    ).map((a, i) => [a.charCodeAt(0), i]),
  ),
  ['='.charCodeAt(0)]: 0,
  ['-'.charCodeAt(0)]: 62,
  ['_'.charCodeAt(0)]: 63,
} as Record<number, number>

/**
 * Decodes a Base64-encoded string (with optional padding and/or URL-safe characters) to {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Base64, Bytes } from 'ox'
 *
 * const value = Base64.toBytes('aGVsbG8gd29ybGQ=')
 * // @log: Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
 * ```
 *
 * @param value - The string, hex value, or byte array to encode.
 * @returns The Base64 decoded {@link ox#Bytes.Bytes}.
 */
export function Base64_toBytes(value: string): Bytes {
  const base64 = value.replace(/=+$/, '')

  const size = base64.length

  const decoded = new Uint8Array(size + 3)
  encoder.encodeInto(base64 + '===', decoded)

  for (let i = 0, j = 0; i < base64.length; i += 4, j += 3) {
    const x =
      (lookup[decoded[i]!]! << 18) +
      (lookup[decoded[i + 1]!]! << 12) +
      (lookup[decoded[i + 2]!]! << 6) +
      lookup[decoded[i + 3]!]!
    decoded[j] = x >> 16
    decoded[j + 1] = (x >> 8) & 0xff
    decoded[j + 2] = x & 0xff
  }

  const decodedSize = (size >> 2) * 3 + (size % 4 && (size % 4) - 1)
  return new Uint8Array(decoded.buffer, 0, decodedSize)
}

export declare namespace Base64_toBytes {
  type ErrorType = GlobalErrorType
}

Base64_toBytes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base64_toBytes.ErrorType

/**
 * Decodes a Base64-encoded string (with optional padding and/or URL-safe characters) to a string.
 *
 * @example
 * ```ts twoslash
 * import { Base64 } from 'ox'
 *
 * const value = Base64.toString('aGVsbG8gd29ybGQ=')
 * // @log: 'hello world'
 * ```
 *
 * @param value - The string, hex value, or byte array to encode.
 * @returns The Base64 decoded string.
 */
export function Base64_toString(value: string): string {
  return Bytes_toString(Base64_toBytes(value))
}

export declare namespace Base64_toString {
  type ErrorType = Base64_toBytes.ErrorType | GlobalErrorType
}

Base64_toString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base64_toString.ErrorType

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
  type ErrorType = Base64_toBytes.ErrorType | GlobalErrorType
}

Base64_toHex.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base64_toHex.ErrorType
