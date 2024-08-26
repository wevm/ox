import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'

/**
 * Retrieves the size of a {@link Hex#Hex} value (in bytes).
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.size('0xdeadbeef') // 4
 * ```
 */
export function Hex_size(value: Hex) {
  return Math.ceil((value.length - 2) / 2)
}

export declare namespace Hex_size {
  export type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Hex_size.parseError = (error: unknown) => error as Hex_size.ErrorType
