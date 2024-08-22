import { valueExponents } from '../constants/value.js'
import type { GlobalErrorType } from '../errors/error.js'
import { parseValue } from './parseValue.js'

/**
 * Parses a string representation of Ether to a `bigint` Value (default: wei).
 *
 * - Docs: https://oxlib.sh/api/value/fromEther
 *
 * @example
 * ```ts
 * import { Value } from 'ox'
 *
 * Value.fromEther('420')
 * // 420000000000000000000n
 * ```
 */
export function parseEther(
  ether: string,
  unit: 'wei' | 'gwei' | 'szabo' | 'finney' = 'wei',
) {
  return parseValue(ether, valueExponents.ether - valueExponents[unit])
}

export declare namespace parseEther {
  type ErrorType = parseValue.ErrorType | GlobalErrorType
}

parseEther.parseError = (error: unknown) => error as parseEther.ErrorType
