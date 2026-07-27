/**
 * Base64 codec tiers, and the tables they share.
 *
 * Split out of the public `Base64` module for the same reason the hex codec is:
 * a runtime selects one tier at import, so the others are unreachable from a
 * test unless they can be called directly. Keeping them here lets the
 * conformance suite compare every tier a runtime can execute, without widening
 * `Base64`'s public surface.
 *
 * @internal
 */

import * as Errors from '../../Errors.js'
import type * as Bytes from '../../Bytes.js'
import { decoder } from './utf8.js'

/** @internal */
export type Options = {
  /** Whether to pad the encoded string. */
  pad?: boolean | undefined
  /** Whether to use the URL-safe alphabet. */
  url?: boolean | undefined
}

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

// Native fast-path detection. `Uint8Array.prototype.toBase64` ships in
// Chromium 145, Safari 18.2+, Firefox 133+ and Bun, but not in Node 24.
//
// Only encoding delegates to it; see `toBytes` for why decoding cannot.
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

/**
 * Encodes via `Uint8Array.prototype.toBase64`, where the runtime has it.
 * `undefined` otherwise, so the conformance suite can ask whether this tier
 * exists rather than inferring it from the runtime.
 *
 * @internal
 */
export const fromBytesNative:
  | ((value: Bytes.Bytes, options?: Options) => string)
  | undefined =
  nativeToBase64 &&
  ((value, options = {}) => {
    const { pad = true, url = false } = options
    // `omitPadding` governs both alphabets, so `base64url` is padded here too
    // when asked. Appending padding on top of that double-pads it.
    return nativeToBase64.call(value, {
      alphabet: url ? 'base64url' : 'base64',
      omitPadding: !pad,
    })
  })

/**
 * Encodes in plain JavaScript, for runtimes without the native method.
 *
 * @internal
 */
export function fromBytesLoop(
  value: Bytes.Bytes,
  options: Options = {},
): string {
  const { pad = true, url = false } = options

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

/**
 * Encodes with whichever tier this runtime provides.
 *
 * @internal
 */
export function fromBytes(value: Bytes.Bytes, options: Options = {}): string {
  if (fromBytesNative) return fromBytesNative(value, options)
  return fromBytesLoop(value, options)
}

/**
 * `Uint8Array.fromBase64` is deliberately unused.
 *
 * Its `alphabet` option is strict and mutually exclusive -- `base64` refuses
 * `-`/`_`, `base64url` refuses `+`/`/` -- while ox decodes either alphabet
 * transparently. There is no single native call with that behavior, so matching
 * it would mean normalizing the string first or trying both alphabets and
 * throwing on one. Both cost more than they would save, and neither has been
 * measured; the loop is the only decode tier until one is.
 */

/**
 * Decodes in plain JavaScript, for runtimes without the native method.
 *
 * @internal
 */
export function toBytesLoop(value: string, bodyEnd: number): Bytes.Bytes {
  const size = bodyEnd

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
    // `characterToInteger` only spans Latin-1, so a code unit above it reads
    // `undefined` and has to be mapped to the sentinel. Without that, `undefined`
    // fails the `=== 0xff` test, then coerces to zero in the shift below, and a
    // non-ASCII character silently decodes as `A`.
    const v = characterToInteger[code] ?? 0xff
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

/**
 * Decodes with whichever tier this runtime provides.
 *
 * @internal
 */
export function toBytes(value: string): Bytes.Bytes {
  // Strip trailing '=' padding (only at the very end).
  let bodyEnd = value.length
  let pad = 0
  while (bodyEnd > 0 && value.charCodeAt(bodyEnd - 1) === 61 /* '=' */) {
    bodyEnd--
    pad++
  }

  // Reject impossible lengths and excessive padding.
  if (bodyEnd % 4 === 1) throw new InvalidLengthError({ length: value.length })
  if (pad > 2) throw new InvalidPaddingError({ padding: pad })

  return toBytesLoop(value, bodyEnd)
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
