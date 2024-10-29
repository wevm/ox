import type * as Errors from '../../Errors.js'
import { Value_exponents } from './constants.js'
import { Value_from } from './from.js'

/**
 * Parses a string representation of Gwei to a `bigint` Value (default: wei).
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 *
 * Value.fromGwei('420')
 * // @log: 420000000000n
 * ```
 *
 * @param gwei - String representation of Gwei.
 * @param unit - The unit to parse to. @default 'wei'.
 * @returns A `bigint` Value.
 */
export function Value_fromGwei(gwei: string, unit: 'wei' = 'wei') {
  return Value_from(gwei, Value_exponents.gwei - Value_exponents[unit])
}

export declare namespace Value_fromGwei {
  type ErrorType = Value_from.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
Value_fromGwei.parseError = (error: unknown) =>
  error as Value_fromGwei.ErrorType
