import type { GlobalErrorType } from '../Errors/error.js'
import { exponents } from './constants.js'
import { from } from './from.js'

/**
 * Parses a string representation of Ether to a `bigint` Value (default: wei).
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 *
 * Value.fromEther('420')
 * // @log: 420000000000000000000n
 * ```
 *
 * @param ether - String representation of Ether.
 * @param unit - The unit to parse to. @default 'wei'.
 * @returns A `bigint` Value.
 */
export function fromEther(
  ether: string,
  unit: 'wei' | 'gwei' | 'szabo' | 'finney' = 'wei',
) {
  return from(ether, exponents.ether - exponents[unit])
}

export declare namespace fromEther {
  type ErrorType = from.ErrorType | GlobalErrorType
}

/* v8 ignore next */
fromEther.parseError = (error: unknown) => error as fromEther.ErrorType
