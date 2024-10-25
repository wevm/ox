import { equalBytes } from '@noble/curves/abstract/utils'

import type * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'

/**
 * Checks if two {@link ox#Bytes.Bytes} values are equal.
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
 * @param bytesA - First {@link ox#Bytes.Bytes} value.
 * @param bytesB - Second {@link ox#Bytes.Bytes} value.
 * @returns `true` if the two values are equal, otherwise `false`.
 */
export function isEqual(bytesA: Bytes.Bytes, bytesB: Bytes.Bytes) {
  return equalBytes(bytesA, bytesB)
}

export declare namespace isEqual {
  type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
isEqual.parseError = (error: unknown) => error as Bytes.isEqual.ErrorType
