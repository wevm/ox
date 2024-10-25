import type * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'

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
export function fromArray(value: readonly number[] | Uint8Array): Bytes.Bytes {
  return value instanceof Uint8Array ? value : new Uint8Array(value)
}

export declare namespace fromArray {
  type ErrorType = Errors.GlobalErrorType
}

fromArray.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Bytes.fromArray.ErrorType
