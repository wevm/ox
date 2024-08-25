import { assertBytes } from '../bytes/assertBytes.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

/**
 * Checks if the given value is {@link Types#Bytes}.
 *
 * - Docs: https://oxlib.sh/api/bytes/isBytes
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.isBytes('0x') // false
 * Bytes.isBytes(Bytes.from([1, 2, 3])) // true
 * ```
 */
export function isBytes(value: unknown): value is Bytes {
  try {
    assertBytes(value)
    return true
  } catch {
    return false
  }
}

export declare namespace isBytes {
  export type ErrorType = GlobalErrorType
}

/* v8 ignore next */
isBytes.parseError = (error: unknown) => error as isBytes.ErrorType
