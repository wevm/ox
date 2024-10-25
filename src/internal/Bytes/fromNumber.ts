import type * as Errors from '../../Errors.js'
import { Hex_fromNumber } from '../Hex/fromNumber.js'
import { Bytes_fromHex } from './fromHex.js'

/**
 * Encodes a number value into {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromNumber(420)
 * // @log: Uint8Array([1, 164])
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromNumber(420, { size: 4 })
 * // @log: Uint8Array([0, 0, 1, 164])
 * ```
 *
 * @param value - Number value to encode.
 * @param options - Encoding options.
 * @returns Encoded {@link ox#Bytes.Bytes}.
 */
export function Bytes_fromNumber(
  value: bigint | number,
  options?: Bytes_fromNumber.Options | undefined,
) {
  const hex = Hex_fromNumber(value, options)
  return Bytes_fromHex(hex)
}

export declare namespace Bytes_fromNumber {
  export type Options = Hex_fromNumber.Options

  export type ErrorType =
    | Hex_fromNumber.ErrorType
    | Bytes_fromHex.ErrorType
    | Errors.GlobalErrorType
}

Bytes_fromNumber.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_fromNumber.ErrorType
