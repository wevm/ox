import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'

/**
 * Retrieves the size of a {@link Types#Hex} value (in bytes).
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.size('0xdeadbeef') // 4
 * ```
 */
export function size(value: Hex) {
  return Math.ceil((value.length - 2) / 2)
}

export declare namespace size {
  export type ErrorType = GlobalErrorType
}

/* v8 ignore next */
size.parseError = (error: unknown) => error as size.ErrorType
