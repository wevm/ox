import { Bytes_random } from '../Bytes/random.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from './types.js'
import { Hex_fromBytes } from './from.js'

/**
 * Generates a random {@link Hex#Hex} value of the specified length.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * const hex = Hex.random(32)
 * // @log: '0x...'
 * ```
 *
 * @returns Random {@link Hex#Hex} value.
 */
export function Hex_random(length: number): Hex {
  return Hex_fromBytes(Bytes_random(length))
}

export declare namespace Hex_random {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Hex_random.parseError = (error: unknown) => error as Hex_random.ErrorType
