import { valueExponents } from '../constants/value.js'
import type { ErrorType as ErrorType_ } from '../errors/error.js'
import { parseValue } from './from.js'

export declare namespace parseEther {
  type ErrorType = parseValue.ErrorType | ErrorType_
}

/**
 * Parses a string representation of Ether to a `bigint` Value (default: wei).
 *
 * - Docs: https://oxlib.sh/api/value/fromEther
 *
 * @example
 * import { Value } from 'viem'
 *
 * Value.fromEther('420')
 * // 420000000000000000000n
 */
export function parseEther(
  ether: string,
  unit: 'wei' | 'gwei' | 'szabo' | 'finney' = 'wei',
) {
  return parseValue(ether, valueExponents.ether - valueExponents[unit])
}
