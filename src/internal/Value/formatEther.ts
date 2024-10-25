import type { GlobalErrorType } from '../Errors/error.js'

import { exponents } from './constants.js'
import { format } from './format.js'

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
  return format(wei, exponents.ether - exponents[unit])
}

export declare namespace formatEther {
  type ErrorType = format.ErrorType | GlobalErrorType
}

/* v8 ignore next */
formatEther.parseError = (error: unknown) => error as formatEther.ErrorType
