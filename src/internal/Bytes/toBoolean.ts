import * as Bytes from '../../Bytes.js'
import * as Errors from '../../Errors.js'
import { assertSize } from './assertSize.js'

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
export function toBoolean(
  bytes: Bytes.Bytes,
  options: Bytes.toBoolean.Options = {},
): boolean {
  const { size } = options
  let bytes_ = bytes
  if (typeof size !== 'undefined') {
    assertSize(bytes_, size)
    bytes_ = Bytes.trimLeft(bytes_)
  }
  if (bytes_.length > 1 || bytes_[0]! > 1)
    throw new Errors.InvalidBytesBooleanError(bytes_)
  return Boolean(bytes_[0])
}

export declare namespace toBoolean {
  type Options = {
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | assertSize.ErrorType
    | Bytes.trimLeft.ErrorType
    | Errors.GlobalErrorType
}

toBoolean.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes.toBoolean.ErrorType
