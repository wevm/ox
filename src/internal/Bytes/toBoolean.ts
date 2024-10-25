import type * as Errors from '../../Errors.js'
import { Bytes_assertSize } from './assertSize.js'
import { Bytes_InvalidBytesBooleanError } from './errors.js'
import { Bytes_trimLeft } from './trim.js'
import type { Bytes } from './types.js'

/**
 * Decodes a {@link ox#Bytes.Bytes} into a boolean.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 *
 * Bytes.toBoolean(Bytes.from([1]))
 * // @log: true
 * ```
 *
 * @param bytes - The {@link ox#Bytes.Bytes} to decode.
 * @param options - Decoding options.
 * @returns Decoded boolean.
 */
export function Bytes_toBoolean(
  bytes_: Bytes,
  options: Bytes_toBoolean.Options = {},
): boolean {
  const { size } = options
  let bytes = bytes_
  if (typeof size !== 'undefined') {
    Bytes_assertSize(bytes, size)
    bytes = Bytes_trimLeft(bytes)
  }
  if (bytes.length > 1 || bytes[0]! > 1)
    throw new Bytes_InvalidBytesBooleanError(bytes)
  return Boolean(bytes[0])
}

export declare namespace Bytes_toBoolean {
  type Options = {
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Bytes_assertSize.ErrorType
    | Bytes_trimLeft.ErrorType
    | Errors.GlobalErrorType
}

Bytes_toBoolean.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_toBoolean.ErrorType
