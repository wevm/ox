import type { Errors } from '../../Errors.js'
import { Bytes_fromHex } from '../Bytes/fromHex.js'
import type { Hex } from '../Hex/types.js'
import { Base64_fromBytes } from './fromBytes.js'

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
export function Base64_fromHex(
  value: Hex,
  options: Base64_fromHex.Options = {},
) {
  return Base64_fromBytes(Bytes_fromHex(value), options)
}

export declare namespace Base64_fromHex {
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

  type ErrorType = Base64_fromBytes.ErrorType | Errors.GlobalErrorType
}

Base64_fromHex.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base64_fromHex.ErrorType
