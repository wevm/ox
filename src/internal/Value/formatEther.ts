import type { GlobalErrorType } from '../Errors/error.js'

import { Value_exponents } from './constants.js'
import { Value_format } from './format.js'

/**
 * Formats a `bigint` Value (default: wei) to a string representation of Ether.
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 *
 * Value.formatEther(1_000_000_000_000_000_000n)
 * // @log: '1'
 * ```
 *
 * @param wei - The Value to format.
 * @param unit - The unit to format the Value in. @default 'wei'.
 * @returns The Ether string representation of the Value.
 */
export function Value_formatEther(
  wei: bigint,
  unit: 'wei' | 'gwei' | 'szabo' | 'finney' = 'wei',
) {
  return Value_format(wei, Value_exponents.ether - Value_exponents[unit])
}

export declare namespace Value_formatEther {
  type ErrorType = Value_format.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Value_formatEther.parseError = (error: unknown) =>
  error as Value_formatEther.ErrorType
