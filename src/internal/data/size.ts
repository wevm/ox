import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import { isHex } from './isHex.js'

/**
 * Retrieves the size of a {@link Hex} or {@link Bytes} value (in bytes).
 *
 * - Docs (Bytes): https://oxlib.sh/api/bytes/size
 * - Docs (Hex): https://oxlib.sh/api/hex/size
 *
 * @example
 * import { Data } from 'ox'
 * Data.size('0xdeadbeef') // 4
 * Data.size(Bytes.from([1, 2, 3, 4])) // 4
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.size(Bytes.from([1, 2, 3, 4])) // 4
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.size('0xdeadbeef') // 4
 */
export function size(value: Hex | Bytes) {
  if (isHex(value, { strict: false })) return Math.ceil((value.length - 2) / 2)
  return value.length
}

export declare namespace size {
  export type ErrorType = isHex.ErrorType | GlobalErrorType
}

size.parseError = (error: unknown) => error as size.ErrorType
