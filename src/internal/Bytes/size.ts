import type * as Errors from '../../Errors.js'
import type { Bytes } from './types.js'

/**
 * Retrieves the size of a {@link ox#Bytes.Bytes} value.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.size(Bytes.from([1, 2, 3, 4]))
 * // @log: 4
 * ```
 *
 * @param value - {@link ox#Bytes.Bytes} value.
 * @returns Size of the {@link ox#Bytes.Bytes} value.
 */
export function Bytes_size(value: Bytes): number {
  return value.length
}

export declare namespace Bytes_size {
  export type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
Bytes_size.parseError = (error: unknown) => error as Bytes_size.ErrorType
