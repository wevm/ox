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
export function size(value: Bytes) {
  return value.length
}

export declare namespace size {
  export type ErrorType = GlobalErrorType
}

/* v8 ignore next */
size.parseError = (error: unknown) => error as size.ErrorType
