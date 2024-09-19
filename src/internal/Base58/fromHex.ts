import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import { Base58_from } from './from.js'

/**
 * Encodes a {@link ox#Hex.Hex} to a Base58-encoded string.
 *
 * @example
 * ```ts twoslash
 * import { Base58, Hex } from 'ox'
 *
 * const value = Base58.fromHex(Hex.fromString('Hello World!'))
 * // @log: '2NEpo7TZRRrLZSi2U'
 * ```
 *
 * @param value - The byte array to encode.
 * @returns The Base58 encoded string.
 */
export function Base58_fromHex(value: Hex) {
  return Base58_from(value)
}

export declare namespace Base58_fromHex {
  type ErrorType = Base58_from.ErrorType | GlobalErrorType
}

Base58_fromHex.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base58_fromHex.ErrorType
