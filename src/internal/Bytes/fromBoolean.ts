import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import { assertSize } from './assertSize.js'

/**
 * Encodes a boolean value into {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromBoolean(true)
 * // @log: Uint8Array([1])
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromBoolean(true, { size: 32 })
 * // @log: Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1])
 * ```
 *
 * @param value - Boolean value to encode.
 * @param options - Encoding options.
 * @returns Encoded {@link ox#Bytes.Bytes}.
 */
export function fromBoolean(
  value: boolean,
  options: Bytes.fromBoolean.Options = {},
) {
  const { size } = options
  const bytes = new Uint8Array(1)
  bytes[0] = Number(value)
  if (typeof size === 'number') {
    assertSize(bytes, size)
    return Bytes.padLeft(bytes, size)
  }
  return bytes
}

export declare namespace fromBoolean {
  type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | assertSize.ErrorType
    | Bytes.padLeft.ErrorType
    | Errors.GlobalErrorType
}

fromBoolean.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes.fromBoolean.ErrorType
