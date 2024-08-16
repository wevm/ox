import { valueExponents } from '../constants/value.js'
import type { ErrorType as ErrorType_ } from '../errors/error.js'

import { formatValue } from './format.js'

export declare namespace formatEther {
  type ErrorType = formatValue.ErrorType | ErrorType_
}

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
