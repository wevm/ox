import * as Bytes from './Bytes.js'
import type * as Errors from './Errors.js'
import * as Hex from './Hex.js'

const alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

// Character code to 6-bit value, for both alphabets. Any other character,
// `=` included, reads as zero.
const characterToInteger = /*#__PURE__*/ (() => {
  const table = new Uint8Array(256)
  for (let i = 0; i < 64; i++) table[alphabet.charCodeAt(i)] = i
  table[45 /* - */] = 62
  table[95 /* _ */] = 63
  return table
})()

// Taken from the prototype once, as `Hex.fromBytes` takes `toHex`.
const nativeToBase64 = (
  Uint8Array.prototype as {
    toBase64?: (options: {
      alphabet: 'base64' | 'base64url'
      omitPadding: boolean
    }) => string
  }
).toBase64

/**
 * Encodes a {@link ox#Bytes.Bytes} to a Base64-encoded string (with optional padding and/or URL-safe characters).
 *
 * @example
 * ```ts twoslash
 * import { Base64, Bytes } from 'ox'
 *
 * const value = Base64.fromBytes(Bytes.fromString('hello world'))
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
 * const value = Base64.fromBytes(Bytes.fromString('hello world'), { pad: false })
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
 * const value = Base64.fromBytes(Bytes.fromString('hello wod'), { url: true })
 * // @log: 'aGVsbG8gd29_77-9ZA=='
 * ```
 *
 * @param value - The byte array to encode.
 * @param options - Encoding options.
 * @returns The Base64 encoded string.
 */
export function fromBytes(value: Bytes.Bytes, options: fromBytes.Options = {}) {
  const { pad = true, url = false } = options

  // Native `Uint8Array.prototype.toBase64` is several times faster. Empty
  // values (including detached views) skip it, since it throws on those.
  if (nativeToBase64 && value instanceof Uint8Array && value.length > 0)
    return nativeToBase64.call(value, {
      alphabet: url ? 'base64url' : 'base64',
      omitPadding: !pad,
    })

  let base64 = ''
  for (let j = 0; j < value.length; j += 3) {
    const y = (value[j]! << 16) | (value[j + 1]! << 8) | value[j + 2]!
    base64 +=
      alphabet[y >> 18]! +
      alphabet[(y >> 12) & 0x3f] +
      alphabet[(y >> 6) & 0x3f] +
      alphabet[y & 0x3f]
  }

  const k = value.length % 3
  if (k) base64 = base64.slice(0, k - 3) + (pad ? '=='.slice(k - 1) : '')
  if (url) base64 = base64.replaceAll('+', '-').replaceAll('/', '_')
  return base64
}

export declare namespace fromBytes {
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

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Encodes a {@link ox#Hex.Hex} to a Base64-encoded string (with optional padding and/or URL-safe characters).
 *
 * @example
 * ```ts twoslash
 * import { Base64, Hex } from 'ox'
 *
 * const value = Base64.fromHex(Hex.fromString('hello world'))
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
 * const value = Base64.fromHex(Hex.fromString('hello world'), { pad: false })
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
 * const value = Base64.fromHex(Hex.fromString('hello wod'), { url: true })
 * // @log: 'aGVsbG8gd29_77-9ZA=='
 * ```
 *
 * @param value - The hex value to encode.
 * @param options - Encoding options.
 * @returns The Base64 encoded string.
 */
export function fromHex(value: Hex.Hex, options: fromHex.Options = {}) {
  return fromBytes(Bytes.fromHex(value), options)
}

export declare namespace fromHex {
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

  type ErrorType = fromBytes.ErrorType | Errors.GlobalErrorType
}

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
export function fromString(value: string, options: fromString.Options = {}) {
  return fromBytes(Bytes.fromString(value), options)
}

export declare namespace fromString {
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

  type ErrorType = fromBytes.ErrorType | Errors.GlobalErrorType
}

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
export function toBytes(value: string): Bytes.Bytes {
  let size = value.length
  while (size > 0 && value.charCodeAt(size - 1) === 61 /* = */) size--

  const decoded = new Uint8Array((size >> 2) * 3 + (size % 4 && (size % 4) - 1))
  for (let i = 0, j = 0, bits = 0, x = 0; i < size; i++) {
    x = (x << 6) | (characterToInteger[value.charCodeAt(i)] ?? 0)
    bits += 6
    if (bits >= 8) decoded[j++] = x >> (bits -= 8)
  }
  return decoded
}

export declare namespace toBytes {
  type ErrorType = Errors.GlobalErrorType
}

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
export function toHex(value: string): Hex.Hex {
  return Hex.fromBytes(toBytes(value))
}

export declare namespace toHex {
  type ErrorType = toBytes.ErrorType | Errors.GlobalErrorType
}

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
export function toString(value: string): string {
  return Bytes.toString(toBytes(value))
}

export declare namespace toString {
  type ErrorType = toBytes.ErrorType | Errors.GlobalErrorType
}
