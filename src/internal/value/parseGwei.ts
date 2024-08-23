import { valueExponents } from '../constants/value.js'
import type { GlobalErrorType } from '../errors/error.js'
import { parseValue } from './parseValue.js'

/**
 * Parses a string representation of Gwei to a `bigint` Value (default: wei).
 *
 * @example
 * ```ts
 * import { Value } from 'ox'
 *
 * Value.fromGwei('420')
 * // 420000000000n
 * ```
 *
 * @alias ox!Value.parseGwei:function(1)
 */
export function parseGwei(ether: string, unit: 'wei' = 'wei') {
  return parseValue(ether, valueExponents.gwei - valueExponents[unit])
}

export declare namespace parseGwei {
  type ErrorType = parseValue.ErrorType | GlobalErrorType
}

/* v8 ignore next */
parseGwei.parseError = (error: unknown) => error as parseGwei.ErrorType
