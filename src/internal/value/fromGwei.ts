import { valueExponents } from '../constants/value.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Value_from } from './from.js'

/**
 * Parses a string representation of Gwei to a `bigint` Value (default: wei).
 *
 * @example
 * ```ts
 * import { Value } from 'ox'
 *
 * Value.fromGwei('420')
 * // 420000000000n
 * ```
 */
export function Value_fromGwei(ether: string, unit: 'wei' = 'wei') {
  return Value_from(ether, valueExponents.gwei - valueExponents[unit])
}

export declare namespace Value_fromGwei {
  type ErrorType = Value_from.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Value_fromGwei.parseError = (error: unknown) =>
  error as Value_fromGwei.ErrorType
