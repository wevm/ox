import type { GlobalErrorType } from '../errors/error.js'

import { Value_exponents } from './constants.js'
import { Value_format } from './format.js'

/**
 * Formats a `bigint` Value (default: wei) to a string representation of Gwei.
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 *
 * Value.formatGwei(1_000_000_000n)
 * // @log: '1'
 * ```
 *
 * @param wei - The Value to format.
 * @param unit - The unit to format the Value in. @default 'wei'.
 * @returns The Gwei string representation of the Value.
 */
export function Value_formatGwei(wei: bigint, unit: 'wei' = 'wei') {
  return Value_format(wei, Value_exponents.gwei - Value_exponents[unit])
}

export declare namespace Value_formatGwei {
  type ErrorType = Value_format.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Value_formatGwei.parseError = (error: unknown) =>
  error as Value_formatGwei.ErrorType
