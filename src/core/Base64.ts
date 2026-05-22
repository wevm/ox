import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import { decoder } from './internal/codec/utf8.js'

// Standard Base64 alphabet (RFC 4648 section 4) and URL-safe alphabet (section 5).
const stdAlphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

// Char-code -> 6-bit integer lookup. Sentinel `0xff` = invalid character.
// Standard alphabet plus URL-safe `-`/`_` (decoders are alphabet-agnostic).
const characterToInteger = /*#__PURE__*/ (() => {
  const table = new Uint8Array(256).fill(0xff)
  for (let i = 0; i < stdAlphabet.length; i++)
    table[stdAlphabet.charCodeAt(i)] = i
  // URL-safe alternates: `-` for `+` (62), `_` for `/` (63).
  table[45 /* '-' */] = 62
  table[95 /* '_' */] = 63
  return table
})()

// Integer -> char-code table for the standard alphabet, indexed by 6-bit value.
const integerToCharacter = /*#__PURE__*/ (() => {
  const table = new Uint8Array(64)
  for (let i = 0; i < stdAlphabet.length; i++)
    table[i] = stdAlphabet.charCodeAt(i)
  return table
})()

// Phase 2 native fast-path detection: `Uint8Array.prototype.toBase64` /
// `Uint8Array.fromBase64` ship in Node 22+, Safari 18+, Firefox 133+.
const nativeToBase64:
  | ((
      this: Uint8Array,
      options?: { alphabet?: 'base64' | 'base64url'; omitPadding?: boolean },
    ) => string)
  | undefined = (
  Uint8Array.prototype as Uint8Array & {
    toBase64?: (options?: {
      alphabet?: 'base64' | 'base64url'
      omitPadding?: boolean
    }) => string
  }
).toBase64
const nativeFromBase64:
  | ((
      value: string,
      options?: {
        alphabet?: 'base64' | 'base64url-or-base64'
        lastChunkHandling?: 'loose' | 'strict' | 'stop-before-partial'
      },
    ) => Uint8Array)
  | undefined = (
  Uint8Array as typeof Uint8Array & {
    fromBase64?: (
      value: string,
      options?: {
        alphabet?: 'base64' | 'base64url-or-base64'
        lastChunkHandling?: 'loose' | 'strict' | 'stop-before-partial'
      },
    ) => Uint8Array
  }
).fromBase64

/**
 * Encodes a {@link ox#Bytes.Bytes} to a Base64-encoded string (with optional padding and/or URL-safe characters).
 *
 * @example
 * ```ts twoslash
 * import { Base64, Bytes } from 'ox'
 *
 * const value = Base64.fromBytes(
 *   Bytes.fromString('hello world')
 * )
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
 * const value = Base64.fromBytes(
 *   Bytes.fromString('hello world'),
 *   { pad: false }
 * )
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
 * const value = Base64.fromBytes(
 *   Bytes.fromString('hello wod'),
 *   { url: true }
 * )
 * // @log: 'aGVsbG8gd29_77-9ZA=='
 * ```
 *
 * @param value - The byte array to encode.
 * @param options - Encoding options.
 * @returns The Base64 encoded string.
 */
export function fromBytes(value: Bytes.Bytes, options: fromBytes.Options = {}) {
  const { pad = true, url = false } = options

  if (nativeToBase64) {
    const out = nativeToBase64.call(value, {
      alphabet: url ? 'base64url' : 'base64',
      omitPadding: !pad,
    })
    // Native `base64url` already omits padding; if pad was requested, restore it.
    if (url && pad) {
      const k = value.length % 3
      if (k === 1) return `${out}==`
      if (k === 2) return `${out}=`
    }
    return out
  }

  const encoded = new Uint8Array(Math.ceil(value.length / 3) * 4)

  for (let i = 0, j = 0; j < value.length; i += 4, j += 3) {
    const y = (value[j]! << 16) + (value[j + 1]! << 8) + (value[j + 2]! | 0)
    encoded[i] = integerToCharacter[y >> 18]!
    encoded[i + 1] = integerToCharacter[(y >> 12) & 0x3f]!
    encoded[i + 2] = integerToCharacter[(y >> 6) & 0x3f]!
    encoded[i + 3] = integerToCharacter[y & 0x3f]!
  }

  const k = value.length % 3
  const end = Math.floor(value.length / 3) * 4 + (k && k + 1)
  let base64 = decoder.decode(new Uint8Array(encoded.buffer, 0, end))
  if (pad && k === 1) base64 += '=='
  if (pad && k === 2) base64 += '='
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
 * const value = Base64.fromHex(
 *   Hex.fromString('hello world'),
 *   { pad: false }
 * )
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
 * const value = Base64.fromHex(Hex.fromString('hello wod'), {
 *   url: true
 * })
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
 * const value = Base64.fromString('hello world', {
 *   pad: false
 * })
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
  // Strip trailing '=' padding (only at the very end).
  let bodyEnd = value.length
  let pad = 0
  while (bodyEnd > 0 && value.charCodeAt(bodyEnd - 1) === 61 /* '=' */) {
    bodyEnd--
    pad++
  }

  const size = bodyEnd
  // Reject impossible lengths and excessive padding.
  if (size % 4 === 1) throw new InvalidLengthError({ length: value.length })
  if (pad > 2) throw new InvalidPaddingError({ padding: pad })

  if (nativeFromBase64) {
    try {
      // `base64url-or-base64` accepts both alphabets transparently.
      return nativeFromBase64(value.slice(0, bodyEnd), {
        alphabet: 'base64url-or-base64',
        lastChunkHandling: 'loose',
      })
    } catch {
      // Fall through to the JS path so we throw the typed error class.
    }
  }

  // Validate characters: every char must be in the standard or URL-safe
  // alphabet, and '=' may not appear in the body (only stripped trailing
  // padding).
  const decoded = new Uint8Array(
    (size >> 2) * 3 + (size % 4 ? (size % 4) - 1 : 0),
  )
  let acc = 0
  let bits = 0
  let n = 0
  for (let i = 0; i < size; i++) {
    const code = value.charCodeAt(i)
    if (code === 61 /* '=' */)
      throw new InvalidCharacterError({ character: '=' })
    const v = characterToInteger[code]!
    if (v === 0xff) throw new InvalidCharacterError({ character: value[i]! })
    acc = (acc << 6) | v
    bits += 6
    if (bits >= 8) {
      bits -= 8
      decoded[n++] = (acc >>> bits) & 0xff
    }
  }
  return decoded
}

export declare namespace toBytes {
  type ErrorType =
    | InvalidCharacterError
    | InvalidLengthError
    | InvalidPaddingError
    | Errors.GlobalErrorType
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

/** Thrown when a Base64 string contains an invalid character. */
export class InvalidCharacterError extends Errors.BaseError {
  override readonly name = 'Base64.InvalidCharacterError'

  constructor({ character }: { character: string }) {
    super(`Invalid Base64 character: "${character}".`)
  }
}

/** Thrown when a Base64 string has an impossible length. */
export class InvalidLengthError extends Errors.BaseError {
  override readonly name = 'Base64.InvalidLengthError'

  constructor({ length }: { length: number }) {
    super(`Invalid Base64 input length \`${length}\`.`)
  }
}

/** Thrown when a Base64 string contains too many trailing `=` padding characters. */
export class InvalidPaddingError extends Errors.BaseError {
  override readonly name = 'Base64.InvalidPaddingError'

  constructor({ padding }: { padding: number }) {
    super(`Invalid Base64 padding length \`${padding}\` (must be 0, 1, or 2).`)
  }
}
