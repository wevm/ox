import type * as Errors from '../../Errors.js'
import { Bytes_random } from '../Bytes/random.js'
import { Hex_fromBytes } from './fromBytes.js'
import type { Hex } from './types.js'

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
export function Hex_random(length: number): Hex {
  return Hex_fromBytes(Bytes_random(length))
}

export declare namespace Hex_random {
  type ErrorType = Errors.GlobalErrorType
}

/* v8 ignore next */
Hex_random.parseError = (error: unknown) => error as Hex_random.ErrorType
