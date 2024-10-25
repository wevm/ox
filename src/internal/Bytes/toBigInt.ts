import type * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import { assertSize } from './assertSize.js'

/**
 * Decodes a {@link ox#Bytes.Bytes} into a bigint.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 *
 * Bytes.toBigInt(Bytes.from([1, 164]))
 * // @log: 420n
 * ```
 *
 * @param bytes - The {@link ox#Bytes.Bytes} to decode.
 * @param options - Decoding options.
 * @returns Decoded bigint.
 */
export function toBigInt(
  bytes: Bytes.Bytes,
  options: Bytes.toBigInt.Options = {},
): bigint {
  const { size } = options
  if (typeof size !== 'undefined') assertSize(bytes, size)
  const hex = Hex.fromBytes(bytes, options)
  return Hex.toBigInt(hex, options)
}

export declare namespace toBigInt {
  type Options = {
    /** Whether or not the number of a signed representation. */
    signed?: boolean | undefined
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex.fromBytes.ErrorType
    | Hex.toBigInt.ErrorType
    | Errors.GlobalErrorType
}

toBigInt.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes.toBigInt.ErrorType
