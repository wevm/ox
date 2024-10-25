import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import { assertSize } from './assertSize.js'

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
export function fromString(
  value: string,
  options: Bytes.fromString.Options = {},
): Bytes.Bytes {
  const { size } = options

  const bytes = encoder.encode(value)
  if (typeof size === 'number') {
    assertSize(bytes, size)
    return Bytes.padRight(bytes, size)
  }
  return bytes
}

export declare namespace fromString {
  type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | assertSize.ErrorType
    | Bytes.padRight.ErrorType
    | Errors.GlobalErrorType
}

fromString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes.fromString.ErrorType
