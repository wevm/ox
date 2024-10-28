import type { Errors } from '../../Errors.js'
import type { Bytes } from './types.js'

/**
 * Converts an array of unsigned 8-bit integers into {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const data = Bytes.fromArray([255, 124, 5, 4])
 * // @log: Uint8Array([255, 124, 5, 4])
 * ```
 *
 * @param value - Value to convert.
 * @returns A {@link ox#Bytes.Bytes} instance.
 */
export function Bytes_fromArray(value: readonly number[] | Uint8Array): Bytes {
  return value instanceof Uint8Array ? value : new Uint8Array(value)
}

export declare namespace Bytes_fromArray {
  type ErrorType = Errors.GlobalErrorType
}

Bytes_fromArray.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes_fromArray.ErrorType
