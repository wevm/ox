import { assertBytes } from '../bytes/assert.js'
import type { ErrorType as ErrorType_ } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

export declare namespace isBytes {
  export type ErrorType = ErrorType_
}

/**
 * Checks if the given value is {@link Bytes}.
 *
 * - Docs: https://oxlib.sh/api/bytes/isBytes
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.isBytes('0x') // false
 * Bytes.isBytes(Bytes.from([1, 2, 3])) // true
 */
export function isBytes(value: unknown): value is Bytes {
  try {
    assertBytes(value)
    return true
  } catch {
    return false
  }
}
