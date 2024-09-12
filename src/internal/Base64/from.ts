import { base64, base64nopad, base64url, base64urlnopad } from '@scure/base'
import { Bytes_from } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'

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
  const fn = url
    ? pad
      ? base64url
      : base64urlnopad
    : pad
      ? base64
      : base64nopad
  return fn.encode(Bytes_from(value))
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
