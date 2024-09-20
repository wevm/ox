import { Bytes_random } from '../Bytes/random.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'

/**
 * Generates a random salt of the specified size.
 *
 * @example
 * ```ts twoslash
 * import { AesGcm } from 'ox'
 *
 * const salt = AesGcm.randomSalt()
 * // @log: Uint8Array [123, 79, 183, 167, 163, 136, 136, 16, 168, 126, 13, 165, 170, 166, 136, 136, 16, 168, 126, 13, 165, 170, 166, 136, 136, 16, 168, 126, 13, 165, 170, 166]
 * ```
 *
 * @param size - The size of the salt to generate. Defaults to `32`.
 * @returns A random salt of the specified size.
 */
export function AesGcm_randomSalt(size = 32): Bytes {
  return Bytes_random(size)
}

export declare namespace AesGcm_randomSalt {
  type ErrorType = Bytes_random.ErrorType | GlobalErrorType
}

Bytes_random.parseError = (error) =>
  /* v8 ignore next */
  error as AesGcm_randomSalt.ErrorType
