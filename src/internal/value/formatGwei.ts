import { valueExponents } from '../constants/value.js'
import type { GlobalErrorType } from '../errors/error.js'

import { formatValue } from './formatValue.js'

/**
 * Formats a `bigint` Value (default: wei) to a string representation of Gwei.
 *
 * - Docs: https://oxlib.sh/api/value/formatGwei
 *
 * @example
 * ```ts
 * import { Value } from 'ox'
 *
 * Value.formatGwei(1_000_000_000n)
 * // '1'
 * ```
 */
export function formatGwei(wei: bigint, unit: 'wei' = 'wei') {
  return formatValue(wei, valueExponents.gwei - valueExponents[unit])
}

export declare namespace formatGwei {
  type ErrorType = formatValue.ErrorType | GlobalErrorType
}

/* v8 ignore next */
formatGwei.parseError = (error: unknown) => error as formatGwei.ErrorType
