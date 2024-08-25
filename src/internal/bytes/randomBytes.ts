import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

/**
 * Generates a random byte array of the specified length.
 *
 * - Docs: https://oxlib.sh/api/bytes/random
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const bytes = Bytes.random(32)
 * ```
 *
 * @alias ox!Bytes.randomBytes:function(1)
 */
export function randomBytes(length: number): Bytes {
  return crypto.getRandomValues(new Uint8Array(length))
}

export declare namespace randomBytes {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
randomBytes.parseError = (error: unknown) => error as randomBytes.ErrorType
