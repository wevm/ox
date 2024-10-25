import type * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'

/**
 * Generates random {@link ox#Bytes.Bytes} of the specified length.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * const bytes = Bytes.random(32)
 * // @log: Uint8Array([... x32])
 * ```
 *
 * @param length - Length of the random {@link ox#Bytes.Bytes} to generate.
 * @returns Random {@link ox#Bytes.Bytes} of the specified length.
 */
export function random(length: number): Bytes.Bytes {
  return crypto.getRandomValues(new Uint8Array(length))
}

export declare namespace random {
  type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
random.parseError = (error: unknown) => error as Bytes.random.ErrorType
