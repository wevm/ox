import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'

/**
 * Generates a random {@link ox#Hex.Hex} value of the specified length.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * const hex = Hex.random(32)
 * // @log: '0x...'
 * ```
 *
 * @returns Random {@link ox#Hex.Hex} value.
 */
export function random(length: number): Hex.Hex {
  return Hex.fromBytes(Bytes.random(length))
}

export declare namespace random {
  type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
random.parseError = (error: unknown) => error as Hex.random.ErrorType
