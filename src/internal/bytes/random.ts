import type { Bytes } from '../bytes/types.js'
import type { GlobalErrorType } from '../errors/error.js'

/**
 * Generates random {@link Bytes#Bytes} of the specified length.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const bytes = Bytes.random(32)
 * // @log: Uint8Array([... x32])
 * ```
 *
 * @param length - Length of the random {@link Bytes#Bytes} to generate.
 * @returns Random {@link Bytes#Bytes} of the specified length.
 */
export function Bytes_random(length: number): Bytes {
  return crypto.getRandomValues(new Uint8Array(length))
}

export declare namespace Bytes_random {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Bytes_random.parseError = (error: unknown) => error as Bytes_random.ErrorType
