import type { Errors } from '../../Errors.js'
import { Bytes_assertSize } from './assertSize.js'
import { Bytes_padRight } from './pad.js'
import type { Bytes } from './types.js'

const encoder = /*#__PURE__*/ new TextEncoder()

/**
 * Encodes a string into {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromString('Hello world!')
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100, 33])
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromString('Hello world!', { size: 32 })
 * // @log: Uint8Array([72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
 * ```
 *
 * @param value - String to encode.
 * @param options - Encoding options.
 * @returns Encoded {@link ox#Bytes.Bytes}.
 */
export function Bytes_fromString(
  value: string,
  options: Bytes_fromString.Options = {},
): Bytes {
  const { size } = options

  const bytes = encoder.encode(value)
  if (typeof size === 'number') {
    Bytes_assertSize(bytes, size)
    return Bytes_padRight(bytes, size)
  }
  return bytes
}

export declare namespace Bytes_fromString {
  type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Bytes_assertSize.ErrorType
    | Bytes_padRight.ErrorType
    | Errors.GlobalErrorType
}

Bytes_fromString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_fromString.ErrorType
