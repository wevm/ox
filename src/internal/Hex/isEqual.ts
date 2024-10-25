import { equalBytes } from '@noble/curves/abstract/utils'

import type * as Errors from '../../Errors.js'
import { Bytes_fromHex } from '../Bytes/fromHex.js'
import type { Hex } from './types.js'

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
export function Hex_isEqual(hexA: Hex, hexB: Hex) {
  return equalBytes(Bytes_fromHex(hexA), Bytes_fromHex(hexB))
}

export declare namespace Hex_isEqual {
  type ErrorType = Bytes_fromHex.ErrorType | Errors.GlobalErrorType
}

/* v8 ignore next */
Hex_isEqual.parseError = (error: unknown) => error as Hex_isEqual.ErrorType
