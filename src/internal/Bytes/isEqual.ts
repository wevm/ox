import { equalBytes } from '@noble/curves/abstract/utils'

import type { GlobalErrorType } from '../Errors/error.js'
import type { Bytes } from './types.js'

/**
 * Checks if two {@link Bytes#Bytes} values are equal.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.isEqual(Bytes.from([1]), Bytes.from([1]))
 * // @log: true
 *
 * Bytes.isEqual(Bytes.from([1]), Bytes.from([2]))
 * // @log: false
 * ```
 *
 * @param bytesA - First {@link Bytes#Bytes} value.
 * @param bytesB - Second {@link Bytes#Bytes} value.
 * @returns `true` if the two values are equal, otherwise `false`.
 */
export function Bytes_isEqual(bytesA: Bytes, bytesB: Bytes) {
  return equalBytes(bytesA, bytesB)
}

export declare namespace Bytes_isEqual {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Bytes_isEqual.parseError = (error: unknown) => error as Bytes_isEqual.ErrorType
