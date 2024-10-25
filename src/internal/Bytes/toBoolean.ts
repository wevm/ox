import type { GlobalErrorType } from '../Errors/error.js'
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
  bytes: Bytes,
  options: Bytes_toBoolean.Options = {},
): boolean {
  const { size } = options
  let bytes_ = bytes
  if (typeof size !== 'undefined') {
    Bytes_assertSize(bytes_, size)
    bytes_ = Bytes_trimLeft(bytes_)
  }
  if (bytes_.length > 1 || bytes_[0]! > 1)
    throw new Bytes_InvalidBytesBooleanError(bytes_)
  return Boolean(bytes_[0])
}

export declare namespace Bytes_toBoolean {
  type Options = {
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Bytes_assertSize.ErrorType
    | Bytes_trimLeft.ErrorType
    | GlobalErrorType
}

Bytes_toBoolean.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_toBoolean.ErrorType
