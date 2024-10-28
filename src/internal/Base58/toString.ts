import type { Errors } from '../../Errors.js'
import { Hex_toString } from '../Hex/toString.js'
import { Base58_toHex } from './toHex.js'

/**
 * Decodes a Base58-encoded string to a string.
 *
 * @example
 * ```ts twoslash
 * import { Base58 } from 'ox'
 *
 * const value = Base58.toString('2NEpo7TZRRrLZSi2U')
 * // @log: 'Hello World!'
 * ```
 *
 * @param value - The Base58 encoded string.
 * @returns The decoded string.
 */
export function Base58_toString(value: string): string {
  return Hex_toString(Base58_toHex(value))
}

export declare namespace Base58_toString {
  type ErrorType = Errors.GlobalErrorType
}

Base58_toString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base58_toString.ErrorType
