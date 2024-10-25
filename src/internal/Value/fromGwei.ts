import type { GlobalErrorType } from '../Errors/error.js'
import { exponents } from './constants.js'
import { from } from './from.js'

/**
 * Parses a string representation of Gwei to a `bigint` Value (default: wei).
 *
 * @example
 * ```ts twoslash
 * import { Value } from 'ox'
 *
 * Value.fromGwei('420')
 * // @log: 420000000000n
 * ```
 *
 * @param gwei - String representation of Gwei.
 * @param unit - The unit to parse to. @default 'wei'.
 * @returns A `bigint` Value.
 */
export function fromGwei(gwei: string, unit: 'wei' = 'wei') {
  return from(gwei, exponents.gwei - exponents[unit])
}

export declare namespace fromGwei {
  type ErrorType = from.ErrorType | GlobalErrorType
}

/* v8 ignore next */
fromGwei.parseError = (error: unknown) => error as fromGwei.ErrorType
