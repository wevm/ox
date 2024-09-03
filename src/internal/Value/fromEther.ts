import type { GlobalErrorType } from '../Errors/error.js'
import { Value_exponents } from './constants.js'
import { Value_from } from './from.js'

/**
 * Parses a string representation of Ether to a `bigint` Value (default: wei).
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 *
 * Value.fromEther('420')
 * // @log: 420000000000000000000n
 * ```
 *
 * @param ether - String representation of Ether.
 * @param unit - The unit to parse to. @default 'wei'.
 * @returns A `bigint` Value.
 */
export function Value_fromEther(
  ether: string,
  unit: 'wei' | 'gwei' | 'szabo' | 'finney' = 'wei',
) {
  return Value_from(ether, Value_exponents.ether - Value_exponents[unit])
}

export declare namespace Value_fromEther {
  type ErrorType = Value_from.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Value_fromEther.parseError = (error: unknown) =>
  error as Value_fromEther.ErrorType
