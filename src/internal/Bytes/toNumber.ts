import type * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import { assertSize } from './assertSize.js'

/**
 * Decodes a {@link ox#Bytes.Bytes} into a number.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.toNumber(Bytes.from([1, 164]))
 * // @log: 420
 * ```
 */
export function toNumber(
  bytes: Bytes.Bytes,
  options: Bytes.toNumber.Options = {},
): number {
  const { size } = options
  if (typeof size !== 'undefined') assertSize(bytes, size)
  const hex = Hex.fromBytes(bytes, options)
  return Hex.toNumber(hex, options)
}

export declare namespace toNumber {
  type Options = {
    /** Whether or not the number of a signed representation. */
    signed?: boolean | undefined
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | Hex.toNumber.ErrorType
    | Errors.GlobalErrorType
}

toNumber.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes.toNumber.ErrorType
