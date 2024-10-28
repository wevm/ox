import type { Errors } from '../../Errors.js'
import { Bytes_fromHex } from '../Bytes/fromHex.js'
import type { Bytes } from '../Bytes/types.js'
import { Base58_toHex } from './toHex.js'

/**
 * Decodes a Base58-encoded string to a {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Base58 } from 'ox'
 *
 * const value = Base58.toBytes('2NEpo7TZRRrLZSi2U')
 * // @log: Uint8Array [ 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33 ]
 * ```
 *
 * @param value - The Base58 encoded string.
 * @returns The decoded byte array.
 */
export function Base58_toBytes(value: string): Bytes {
  return Bytes_fromHex(Base58_toHex(value))
}

export declare namespace Base58_toBytes {
  type ErrorType = Errors.GlobalErrorType
}

Base58_toBytes.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base58_toBytes.ErrorType
