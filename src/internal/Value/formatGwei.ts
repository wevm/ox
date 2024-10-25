import type { GlobalErrorType } from '../Errors/error.js'

import { exponents } from './constants.js'
import { format } from './format.js'

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
export function formatGwei(wei: bigint, unit: 'wei' = 'wei') {
  return format(wei, exponents.gwei - exponents[unit])
}

export declare namespace formatGwei {
  type ErrorType = format.ErrorType | GlobalErrorType
}

/* v8 ignore next */
formatGwei.parseError = (error: unknown) => error as formatGwei.ErrorType
