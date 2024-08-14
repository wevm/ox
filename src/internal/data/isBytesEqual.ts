import { equalBytes } from '@noble/curves/abstract/utils'

import { type ToBytesErrorType, toBytes } from '../bytes/toBytes.js'
import type { ErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import { type IsHexErrorType, isHex } from './isHex.js'

export type IsBytesEqualErrorType =
  | IsHexErrorType
  | ToBytesErrorType
  | ErrorType

/**
 * Checks if two {@link Bytes} or {@link Hex} values are equal.
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.isEqual(Uint8Array.from([1]), Uint8Array.from([1])) // true
 * Bytes.isEqual(Uint8Array.from([1]), Uint8Array.from([2])) // false
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.isEqual('0xdeadbeef', '0xdeadbeef') // true
 * Hex.isEqual('0xda', '0xba') // false
 */
export function isBytesEqual(a_: Bytes | Hex, b_: Bytes | Hex) {
  const a = isHex(a_, { strict: false }) ? toBytes(a_) : a_
  const b = isHex(b_, { strict: false }) ? toBytes(b_) : b_
  return equalBytes(a, b)
}
