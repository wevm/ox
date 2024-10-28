import type { Errors } from '../../Errors.js'
import { Bytes_assertSize } from './assertSize.js'
import { Bytes_padLeft } from './pad.js'

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
export function Bytes_fromBoolean(
  value: boolean,
  options: Bytes_fromBoolean.Options = {},
) {
  const { size } = options
  const bytes = new Uint8Array(1)
  bytes[0] = Number(value)
  if (typeof size === 'number') {
    Bytes_assertSize(bytes, size)
    return Bytes_padLeft(bytes, size)
  }
  return bytes
}

export declare namespace Bytes_fromBoolean {
  type Options = {
    /** Size of the output bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Bytes_assertSize.ErrorType
    | Bytes_padLeft.ErrorType
    | Errors.GlobalErrorType
}

Bytes_fromBoolean.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_fromBoolean.ErrorType
