import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

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
export function fromNumber(
  value: bigint | number,
  options?: Bytes.fromNumber.Options | undefined,
) {
  const hex = Hex.fromNumber(value, options)
  return Bytes.fromHex(hex)
}

export declare namespace fromNumber {
  export type Options = Hex.fromNumber.Options

  export type ErrorType =
    | Hex.fromNumber.ErrorType
    | Bytes.fromHex.ErrorType
    | Errors.GlobalErrorType
}

fromNumber.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes.fromNumber.ErrorType
