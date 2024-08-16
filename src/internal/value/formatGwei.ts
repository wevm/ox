import { valueExponents } from '../constants/value.js'
import type { ErrorType as ErrorType_ } from '../errors/error.js'

import { formatValue } from './format.js'

export declare namespace formatGwei {
  type ErrorType = formatValue.ErrorType | ErrorType_
}

/**
 * Formats a `bigint` Value (default: wei) to a string representation of Gwei.
 *
 * - Docs: https://oxlib.sh/api/value/formatGwei
 *
 * @example
 * import { Value } from 'viem'
 *
 * Value.formatGwei(1_000_000_000n)
 * // '1'
 */
export function formatGwei(wei: bigint, unit: 'wei' = 'wei') {
  return formatValue(wei, valueExponents.gwei - valueExponents[unit])
}
