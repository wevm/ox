import { equalBytes } from '@noble/curves/abstract/utils'

import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'

/**
 * Checks if two {@link ox#Hex.Hex} values are equal.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.isEqual('0xdeadbeef', '0xdeadbeef')
 * // @log: true
 *
 * Hex.isEqual('0xda', '0xba')
 * // @log: false
 * ```
 *
 * @param hexA - The first {@link ox#Hex.Hex} value.
 * @param hexB - The second {@link ox#Hex.Hex} value.
 * @returns `true` if the two {@link ox#Hex.Hex} values are equal, `false` otherwise.
 */
export function isEqual(hexA: Hex.Hex, hexB: Hex.Hex) {
  return equalBytes(Bytes.fromHex(hexA), Bytes.fromHex(hexB))
}

export declare namespace isEqual {
  type ErrorType = Bytes.fromHex.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
isEqual.parseError = (error: unknown) => error as Hex.isEqual.ErrorType
