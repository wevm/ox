import type * as Errors from '../../Errors.js'
import * as Value from '../../Value.js'

import { exponents } from './constants.js'

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
export function formatEther(
  wei: bigint,
  unit: 'wei' | 'gwei' | 'szabo' | 'finney' = 'wei',
) {
  return Value.format(wei, exponents.ether - exponents[unit])
}

export declare namespace formatEther {
  type ErrorType = Value.format.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
formatEther.parseError = (error: unknown) => error as formatEther.ErrorType
