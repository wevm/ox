import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

/**
 * Retrieves the size of a {@link Types#Bytes} value.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.size(Bytes.from([1, 2, 3, 4])) // 4
 * ```
 */
export function Bytes_size(value: Bytes) {
  return value.length
}

export declare namespace Bytes_size {
  export type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Bytes_size.parseError = (error: unknown) => error as Bytes_size.ErrorType
