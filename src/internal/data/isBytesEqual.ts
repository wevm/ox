import { equalBytes } from '@noble/curves/abstract/utils'

import { toBytes } from '../bytes/toBytes.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import { isHex } from './isHex.js'

/**
 * Checks if two {@link Types#Bytes} or {@link Types#Hex} values are equal.
 *
 * - Docs (Bytes): https://oxlib.sh/api/bytes/isEqual
 * - Docs (Hex): https://oxlib.sh/api/hex/isEqual
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.isEqual(Bytes.from([1]), Bytes.from([1])) // true
 * Bytes.isEqual(Bytes.from([1]), Bytes.from([2])) // false
 * ```
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.isEqual('0xdeadbeef', '0xdeadbeef') // true
 * Hex.isEqual('0xda', '0xba') // false
 * ```
 */
export function isBytesEqual(a_: Bytes | Hex, b_: Bytes | Hex) {
  const a = isHex(a_, { strict: false }) ? toBytes(a_) : a_
  const b = isHex(b_, { strict: false }) ? toBytes(b_) : b_
  return equalBytes(a, b)
}

export declare namespace isBytesEqual {
  type ErrorType = isHex.ErrorType | toBytes.ErrorType | GlobalErrorType
}

/* v8 ignore next */
isBytesEqual.parseError = (error: unknown) => error as isBytesEqual.ErrorType
