import type { Errors } from '../../Errors.js'
import type { Bytes } from '../Bytes/types.js'
import { Base58_from } from './from.js'

/**
 * Encodes a {@link ox#Bytes.Bytes} to a Base58-encoded string.
 *
 * @example
 * ```ts twoslash
 * import { Base58, Bytes } from 'ox'
 *
 * const value = Base58.fromBytes(Bytes.fromString('Hello World!'))
 * // @log: '2NEpo7TZRRrLZSi2U'
 * ```
 *
 * @param value - The byte array to encode.
 * @returns The Base58 encoded string.
 */
export function Base58_fromBytes(value: Bytes) {
  return Base58_from(value)
}

export declare namespace Base58_fromBytes {
  type ErrorType = Base58_from.ErrorType | Errors.GlobalErrorType
}

Base58_fromBytes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base58_fromBytes.ErrorType
