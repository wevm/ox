import type { ErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

export type RandomBytesErrorType = ErrorType

/**
 * Generates a random byte array of the specified length.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const bytes = Bytes.random(32)
 * ```
 *
 * @example
 * ```ts
 * import { Data } from 'ox'
 * const bytes = Data.randomBytes(32)
 * ```
 */
export function randomBytes(length: number): Bytes {
  return crypto.getRandomValues(new Uint8Array(length))
}
