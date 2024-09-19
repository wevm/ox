import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
import { Hex_toBigInt } from '../Hex/toBigInt.js'
import { Bytes_assertSize } from './assertSize.js'
import type { Bytes } from './types.js'

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
export function Bytes_toBigInt(
  bytes: Bytes,
  options: Bytes_toBigInt.Options = {},
): bigint {
  const { size } = options
  if (typeof size !== 'undefined') Bytes_assertSize(bytes, size)
  const hex = Hex_fromBytes(bytes, options)
  return Hex_toBigInt(hex, options)
}

export declare namespace Bytes_toBigInt {
  type Options = {
    /** Whether or not the number of a signed representation. */
    signed?: boolean | undefined
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex_fromBytes.ErrorType
    | Hex_toBigInt.ErrorType
    | GlobalErrorType
}

Bytes_toBigInt.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_toBigInt.ErrorType
