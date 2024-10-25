import type * as Errors from '../../Errors.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
import { Hex_toNumber } from '../Hex/toNumber.js'
import { Bytes_assertSize } from './assertSize.js'
import type { Bytes } from './types.js'

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
export function Bytes_toNumber(
  bytes: Bytes,
  options: Bytes_toNumber.Options = {},
): number {
  const { size } = options
  if (typeof size !== 'undefined') Bytes_assertSize(bytes, size)
  const hex = Hex_fromBytes(bytes, options)
  return Hex_toNumber(hex, options)
}

export declare namespace Bytes_toNumber {
  type Options = {
    /** Whether or not the number of a signed representation. */
    signed?: boolean | undefined
    /** Size of the bytes. */
    size?: number | undefined
  }

  type ErrorType =
    | Hex_fromBytes.ErrorType
    | Hex_toNumber.ErrorType
    | Errors.GlobalErrorType
}

Bytes_toNumber.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_toNumber.ErrorType
