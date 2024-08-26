import { valueExponents } from '../constants/value.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Value_from } from './from.js'

/**
 * Parses a string representation of Ether to a `bigint` Value (default: wei).
 *
 * - Docs: https://oxlib.sh/api/value/fromEther
 *
 * @example
 * ```ts
 * import { Value } from 'ox'
 *
 * Value.fromEther('420')
 * // 420000000000000000000n
 * ```
 */
export function Value_fromEther(
  ether: string,
  unit: 'wei' | 'gwei' | 'szabo' | 'finney' = 'wei',
) {
  return Value_from(ether, valueExponents.ether - valueExponents[unit])
}

export declare namespace Value_fromEther {
  type ErrorType = Value_from.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Value_fromEther.parseError = (error: unknown) =>
  error as Value_fromEther.ErrorType
