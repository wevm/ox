import type * as Errors from '../../Errors.js'
import * as Value from '../../Value.js'
import { exponents } from './constants.js'

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
  return Value.from(ether, exponents.ether - exponents[unit])
}

export declare namespace fromEther {
  type ErrorType = Value.from.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
fromEther.parseError = (error: unknown) => error as fromEther.ErrorType
