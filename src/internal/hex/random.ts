import { Bytes_random } from '../bytes/random.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'
import { Hex_fromBytes } from './from.js'

/**
 * Generates a random Hex value of the specified length.
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * const hex = Hex.random(32)
 * ```
 */
export function Hex_random(length: number): Hex {
  return Hex_fromBytes(Bytes_random(length))
}

export declare namespace Hex_random {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Hex_random.parseError = (error: unknown) => error as Hex_random.ErrorType
