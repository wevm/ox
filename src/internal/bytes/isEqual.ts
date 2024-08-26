import { equalBytes } from '@noble/curves/abstract/utils'

import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

/**
 * Checks if two {@link Bytes#Bytes} values are equal.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.isEqual(Bytes.from([1]), Bytes.from([1])) // true
 * Bytes.isEqual(Bytes.from([1]), Bytes.from([2])) // false
 * ```
 */
export function Bytes_isEqual(a: Bytes, b: Bytes) {
  return equalBytes(a, b)
}

export declare namespace Bytes_isEqual {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Bytes_isEqual.parseError = (error: unknown) => error as Bytes_isEqual.ErrorType
