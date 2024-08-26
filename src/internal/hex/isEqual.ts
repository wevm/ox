import { equalBytes } from '@noble/curves/abstract/utils'

import { Bytes_fromHex } from '../bytes/from.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../hex/types.js'

/**
 * Checks if two {@link Hex#Hex} values are equal.
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.isEqual('0xdeadbeef', '0xdeadbeef') // true
 * Hex.isEqual('0xda', '0xba') // false
 * ```
 */
export function Hex_isEqual(a: Hex, b: Hex) {
  return equalBytes(Bytes_fromHex(a), Bytes_fromHex(b))
}

export declare namespace Hex_isEqual {
  type ErrorType = Bytes_fromHex.ErrorType | GlobalErrorType
}

/* v8 ignore next */
Hex_isEqual.parseError = (error: unknown) => error as Hex_isEqual.ErrorType
