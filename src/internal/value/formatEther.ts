import { valueExponents } from '../constants/value.js'
import type { GlobalErrorType } from '../errors/error.js'

import { formatValue } from './formatValue.js'

/**
 * Formats a `bigint` Value (default: wei) to a string representation of Ether.
 *
 * - Docs: https://oxlib.sh/api/value/formatEther
 *
 * @example
 * import { Value } from 'ox'
 *
 * Value.formatEther(1_000_000_000_000_000_000n)
 * // '1'
 */
export function formatEther(
  wei: bigint,
  unit: 'wei' | 'gwei' | 'szabo' | 'finney' = 'wei',
) {
  return formatValue(wei, valueExponents.ether - valueExponents[unit])
}

export declare namespace formatEther {
  type ErrorType = formatValue.ErrorType | GlobalErrorType
}

formatEther.parseError = (error: unknown) => error as formatEther.ErrorType
