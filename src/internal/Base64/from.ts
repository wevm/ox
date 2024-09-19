import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import { Base64_fromBytes } from './fromBytes.js'
import { Base64_fromHex } from './fromHex.js'

/**
 * Encodes a {@link ox#Hex.Hex} or {@link ox#Bytes.Bytes} to a Base64-encoded string (with optional padding and/or URL-safe characters).
 *
 * @example
 * ```ts twoslash
 * import { Base64, Hex } from 'ox'
 *
 * const value = Base64.from(Hex.fromString('hello world'))
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
 * const value = Base64.from(Hex.fromString('hello world'), { pad: false })
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
 * const value = Base64.from(Hex.fromString('hello wod'), { url: true })
 * // @log: 'aGVsbG8gd29_77-9ZA=='
 * ```
 *
 * @param value - The hex value or byte array to encode.
 * @param options - Encoding options.
 * @returns The Base64 encoded string.
 */
export function Base64_from(
  value: Bytes | Hex,
  options: Base64_from.Options = {},
) {
  if (value instanceof Uint8Array) return Base64_fromBytes(value, options)
  return Base64_fromHex(value, options)
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
