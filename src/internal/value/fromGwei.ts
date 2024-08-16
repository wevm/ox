import { valueExponents } from '../constants/value.js'
import type { ErrorType as ErrorType_ } from '../errors/error.js'
import { parseValue } from './from.js'

export declare namespace parseGwei {
  type ErrorType = parseValue.ErrorType | ErrorType_
}

/**
 * Parses a string representation of Gwei to a `bigint` Value (default: wei).
 *
 * - Docs: https://oxlib.sh/api/value/fromGwei
 *
 * @example
 * import { Value } from 'ox'
 *
 * Value.fromGwei('420')
 * // 420000000000n
 */
export function parseGwei(ether: string, unit: 'wei' = 'wei') {
  return parseValue(ether, valueExponents.gwei - valueExponents[unit])
}
