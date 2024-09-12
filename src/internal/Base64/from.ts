import { Bytes_from } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'

const decoder = /*#__PURE__*/ new TextDecoder()
const lookup = /*#__PURE__*/ Object.fromEntries(
  Array.from(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
  ).map((a, i) => [i, a.charCodeAt(0)]),
)

/**
 * Encodes a string, {@link ox#Hex.Hex}, or {@link ox#Bytes.Bytes} to a Base64-encoded string (with optional padding and/or URL-safe characters).
 *
 * @example
 * ```ts twoslash
 * import { Base64 } from 'ox'
 *
 * const value = Base64.from('hello world')
 * // @log: 'aGVsbG8gd29ybGQ='
 * ```
 *
 * @example
 * ### No Padding
 *
 * Turn off [padding of encoded data](https://datatracker.ietf.org/doc/html/rfc4648#section-3.2) with the `pad` option:
 *
 * ```ts twoslash
 * import { Base64 } from 'ox'
 *
 * const value = Base64.from('hello world', { pad: false })
 * // @log: 'aGVsbG8gd29ybGQ'
 * ```
 *
 * ### URL-safe Encoding
 *
 * Turn on [URL-safe encoding](https://datatracker.ietf.org/doc/html/rfc4648#section-5) (Base64 URL) with the `url` option:
 *
 * ```ts twoslash
 * import { Base64 } from 'ox'
 *
 * const value = Base64.from('hello wod', { url: true })
 * // @log: 'aGVsbG8gd29_77-9ZA=='
 * ```
 *
 * @param value - The string, hex value, or byte array to encode.
 * @param options - Encoding options.
 * @returns The Base64 encoded string.
 */
export function Base64_from(
  value: string | Hex | Bytes,
  options: Base64_from.Options = {},
) {
  const { pad = true, url = false } = options

  const bytes = Bytes_from(value)
  const encoded = new Uint8Array(Math.ceil(bytes.length / 3) * 4)

  for (let i = 0, j = 0; j < bytes.length; i += 4, j += 3) {
    const y = (bytes[j]! << 16) + (bytes[j + 1]! << 8) + (bytes[j + 2]! | 0)
    encoded[i] = lookup[y >> 18]!
    encoded[i + 1] = lookup[(y >> 12) & 0x3f]!
    encoded[i + 2] = lookup[(y >> 6) & 0x3f]!
    encoded[i + 3] = lookup[y & 0x3f]!
  }

  const k = bytes.length % 3
  const end = Math.floor(bytes.length / 3) * 4 + (k && k + 1)
  let base64 = decoder.decode(new Uint8Array(encoded.buffer, 0, end))
  if (pad && k === 1) base64 += '=='
  if (pad && k === 2) base64 += '='
  if (url) base64 = base64.replaceAll('+', '-').replaceAll('/', '_')
  return base64
}

export declare namespace Base64_from {
  type Options = {
    /**
     * Whether to [pad](https://datatracker.ietf.org/doc/html/rfc4648#section-3.2) the Base64 encoded string.
     *
     * @default true
     */
    pad?: boolean | undefined
    /**
     * Whether to Base64 encode with [URL safe characters](https://datatracker.ietf.org/doc/html/rfc4648#section-5).
     *
     * @default false
     */
    url?: boolean | undefined
  }

  type ErrorType = GlobalErrorType
}

Base64_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base64_from.ErrorType

/**
 * Encodes a string to a Base64-encoded string (with optional padding and/or URL-safe characters).
 *
 * @example
 * ```ts twoslash
 * import { Base64 } from 'ox'
 *
 * const value = Base64.fromString('hello world')
 * // @log: 'aGVsbG8gd29ybGQ='
 * ```
 *
 * @example
 * ### No Padding
 *
 * Turn off [padding of encoded data](https://datatracker.ietf.org/doc/html/rfc4648#section-3.2) with the `pad` option:
 *
 * ```ts twoslash
 * import { Base64 } from 'ox'
 *
 * const value = Base64.fromString('hello world', { pad: false })
 * // @log: 'aGVsbG8gd29ybGQ'
 * ```
 *
 * ### URL-safe Encoding
 *
 * Turn on [URL-safe encoding](https://datatracker.ietf.org/doc/html/rfc4648#section-5) (Base64 URL) with the `url` option:
 *
 * ```ts twoslash
 * import { Base64 } from 'ox'
 *
 * const value = Base64.fromString('hello wod', { url: true })
 * // @log: 'aGVsbG8gd29_77-9ZA=='
 * ```
 *
 * @param value - The string to encode.
 * @param options - Encoding options.
 * @returns The Base64 encoded string.
 */
export function Base64_fromString(
  value: string,
  options: Base64_fromString.Options = {},
) {
  return Base64_from(value, options)
}

export declare namespace Base64_fromString {
  type Options = Base64_from.Options

  type ErrorType = Base64_from.ErrorType | GlobalErrorType
}

Base64_fromString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base64_fromString.ErrorType

/**
 * Encodes a {@link ox#Bytes.Bytes} to a Base64-encoded string (with optional padding and/or URL-safe characters).
 *
 * @example
 * ```ts twoslash
 * import { Base64, Bytes } from 'ox'
 *
 * const value = Base64.fromBytes(Bytes.from('hello world'))
 * // @log: 'aGVsbG8gd29ybGQ='
 * ```
 *
 * @example
 * ### No Padding
 *
 * Turn off [padding of encoded data](https://datatracker.ietf.org/doc/html/rfc4648#section-3.2) with the `pad` option:
 *
 * ```ts twoslash
 * import { Base64, Bytes } from 'ox'
 *
 * const value = Base64.fromBytes(Bytes.from('hello world'), { pad: false })
 * // @log: 'aGVsbG8gd29ybGQ'
 * ```
 *
 * ### URL-safe Encoding
 *
 * Turn on [URL-safe encoding](https://datatracker.ietf.org/doc/html/rfc4648#section-5) (Base64 URL) with the `url` option:
 *
 * ```ts twoslash
 * import { Base64, Bytes } from 'ox'
 *
 * const value = Base64.fromBytes(Bytes.from('hello wod'), { url: true })
 * // @log: 'aGVsbG8gd29_77-9ZA=='
 * ```
 *
 * @param value - The byte array to encode.
 * @param options - Encoding options.
 * @returns The Base64 encoded string.
 */
export function Base64_fromBytes(
  value: Bytes,
  options: Base64_fromBytes.Options = {},
) {
  return Base64_from(value, options)
}

export declare namespace Base64_fromBytes {
  type Options = Base64_from.Options

  type ErrorType = Base64_from.ErrorType | GlobalErrorType
}

Base64_fromBytes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base64_fromBytes.ErrorType

/**
 * Encodes a {@link ox#Hex.Hex} to a Base64-encoded string (with optional padding and/or URL-safe characters).
 *
 * @example
 * ```ts twoslash
 * import { Base64, Hex } from 'ox'
 *
 * const value = Base64.fromHex(Hex.from('hello world'))
 * // @log: 'aGVsbG8gd29ybGQ='
 * ```
 *
 * @example
 * ### No Padding
 *
 * Turn off [padding of encoded data](https://datatracker.ietf.org/doc/html/rfc4648#section-3.2) with the `pad` option:
 *
 * ```ts twoslash
 * import { Base64, Hex } from 'ox'
 *
 * const value = Base64.fromHex(Hex.from('hello world'), { pad: false })
 * // @log: 'aGVsbG8gd29ybGQ'
 * ```
 *
 * ### URL-safe Encoding
 *
 * Turn on [URL-safe encoding](https://datatracker.ietf.org/doc/html/rfc4648#section-5) (Base64 URL) with the `url` option:
 *
 * ```ts twoslash
 * import { Base64, Hex } from 'ox'
 *
 * const value = Base64.fromHex(Hex.from('hello wod'), { url: true })
 * // @log: 'aGVsbG8gd29_77-9ZA=='
 * ```
 *
 * @param value - The hex value to encode.
 * @param options - Encoding options.
 * @returns The Base64 encoded string.
 */
export function Base64_fromHex(
  value: Hex,
  options: Base64_fromHex.Options = {},
) {
  return Base64_from(value, options)
}

export declare namespace Base64_fromHex {
  type Options = Base64_from.Options

  type ErrorType = Base64_from.ErrorType | GlobalErrorType
}

Base64_fromHex.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base64_fromHex.ErrorType
