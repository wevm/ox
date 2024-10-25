import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'

/**
 * Instantiates a {@link ox#Bytes.Bytes} value from a `Uint8Array`, a hex string, or an array of unsigned 8-bit integers.
 *
 * :::tip
 *
 * To instantiate from a **Boolean**, **String**, or **Number**, use one of the following:
 *
 * - `Bytes.fromBoolean`
 *
 * - `Bytes.fromString`
 *
 * - `Bytes.fromNumber`
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.from([255, 124, 5, 4])
 * // @log: Uint8Array([255, 124, 5, 4])
 *
 * const data = Bytes.from('0xdeadbeef')
 * // @log: Uint8Array([222, 173, 190, 239])
 * ```
 *
 * @param value - Value to convert.
 * @returns A {@link ox#Bytes.Bytes} instance.
 */
export function from(
  value: Hex.Hex | Bytes.Bytes | readonly number[],
): Bytes.Bytes {
  if (value instanceof Uint8Array) return value
  if (typeof value === 'string') return Bytes.fromHex(value)
  return Bytes.fromArray(value)
}

export declare namespace from {
  type ErrorType =
    | Bytes.fromHex.ErrorType
    | Bytes.fromArray.ErrorType
    | Errors.GlobalErrorType
}

from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes.from.ErrorType
