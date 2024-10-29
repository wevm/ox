import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import { Base58_from } from './from.js'

/**
 * Encodes a string to a Base58-encoded string.
 *
 * @example
 * ```ts twoslash
 * import { Base58 } from 'ox'
 *
 * const value = Base58.fromString('Hello World!')
 * // @log: '2NEpo7TZRRrLZSi2U'
 * ```
 *
 * @param value - The string to encode.
 * @returns The Base58 encoded string.
 */
export function Base58_fromString(value: string) {
  return Base58_from(Bytes.fromString(value))
}

export declare namespace Base58_fromString {
  type ErrorType = Base58_from.ErrorType | Errors.GlobalErrorType
}

Base58_fromString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base58_fromString.ErrorType
