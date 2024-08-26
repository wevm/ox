import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

/**
 * Generates random {@link Bytes#Bytes} of the specified length.
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const bytes = Bytes.random(32)
 * ```
 */
export function Bytes_random(length: number): Bytes {
  return crypto.getRandomValues(new Uint8Array(length))
}

export declare namespace Bytes_random {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Bytes_random.parseError = (error: unknown) => error as Bytes_random.ErrorType
