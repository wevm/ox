import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import { Bytes_fromArray } from './fromArray.js'
import { Bytes_fromHex } from './fromHex.js'
import type { Bytes } from './types.js'

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
export function Bytes_from(value: Hex | Bytes | readonly number[]): Bytes {
  if (value instanceof Uint8Array) return value
  if (typeof value === 'string') return Bytes_fromHex(value)
  return Bytes_fromArray(value)
}

export declare namespace Bytes_from {
  type ErrorType =
    | Bytes_fromHex.ErrorType
    | Bytes_fromArray.ErrorType
    | GlobalErrorType
}

Bytes_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_from.ErrorType
