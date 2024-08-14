import type { ErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import { type IsHexErrorType, isHex } from './isHex.js'

export type SizeErrorType = IsHexErrorType | ErrorType

/**
 * Retrieves the size of a {@link Hex} or {@link Bytes} value (in bytes).
 *
 * @example
 * import { Data } from 'ox'
 * Data.size('0xdeadbeef') // 4
 * Data.size(Uint8Array.from([1, 2, 3, 4])) // 4
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.size(Uint8Array.from([1, 2, 3, 4])) // 4
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.size('0xdeadbeef') // 4
 */
export function size(value: Hex | Bytes) {
  if (isHex(value, { strict: false })) return Math.ceil((value.length - 2) / 2)
  return value.length
}
