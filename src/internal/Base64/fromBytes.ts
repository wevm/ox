import type { Bytes } from '../../Bytes.js'
import type { Errors } from '../../Errors.js'

const decoder = /*#__PURE__*/ new TextDecoder()
const lookup = /*#__PURE__*/ Object.fromEntries(
  Array.from(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
  ).map((a, i) => [i, a.charCodeAt(0)]),
)

/**
 * Encodes a {@link ox#(Bytes:namespace).(Bytes:type)} to a Base64-encoded string (with optional padding and/or URL-safe characters).
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
export function Base64_fromBytes(
  value: Bytes,
  options: Base64_fromBytes.Options = {},
) {
  const { pad = true, url = false } = options

  const encoded = new Uint8Array(Math.ceil(value.length / 3) * 4)

  for (let i = 0, j = 0; j < value.length; i += 4, j += 3) {
    const y = (value[j]! << 16) + (value[j + 1]! << 8) + (value[j + 2]! | 0)
    encoded[i] = lookup[y >> 18]!
    encoded[i + 1] = lookup[(y >> 12) & 0x3f]!
    encoded[i + 2] = lookup[(y >> 6) & 0x3f]!
    encoded[i + 3] = lookup[y & 0x3f]!
  }

  const k = value.length % 3
  const end = Math.floor(value.length / 3) * 4 + (k && k + 1)
  let base64 = decoder.decode(new Uint8Array(encoded.buffer, 0, end))
  if (pad && k === 1) base64 += '=='
  if (pad && k === 2) base64 += '='
  if (url) base64 = base64.replaceAll('+', '-').replaceAll('/', '_')
  return base64
}

export declare namespace Base64_fromBytes {
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

Base64_fromBytes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base64_fromBytes.ErrorType
