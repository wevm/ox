import * as Bytes from '../../Bytes.js'
import type * as AesGcm from '../../AesGcm.js'
import type * as Errors from '../../Errors.js'

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
export function AesGcm_randomSalt(size = 32): Bytes.Bytes {
  return Bytes.random(size)
}

export declare namespace AesGcm_randomSalt {
  type ErrorType = Bytes.random.ErrorType | Errors.GlobalErrorType
}

AesGcm_randomSalt.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AesGcm.randomSalt.ErrorType
