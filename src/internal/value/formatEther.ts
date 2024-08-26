import type { GlobalErrorType } from '../errors/error.js'

import { Value_exponents } from './constants.js'
import { Value_format } from './format.js'

/**
 * Formats a `bigint` Value (default: wei) to a string representation of Ether.
 *
 * - Docs: https://oxlib.sh/api/value/formatEther
 *
 * @example
 * ```ts
 * import { Value } from 'ox'
 *
 * Value.formatEther(1_000_000_000_000_000_000n)
 * // '1'
 * ```
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
