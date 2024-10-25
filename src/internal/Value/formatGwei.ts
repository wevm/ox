import type * as Errors from '../../Errors.js'
import * as Value from '../../Value.js'

import { exponents } from './constants.js'

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
  return Value.format(wei, exponents.gwei - exponents[unit])
}

export declare namespace formatGwei {
  type ErrorType = Value.format.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
formatGwei.parseError = (error: unknown) => error as formatGwei.ErrorType
