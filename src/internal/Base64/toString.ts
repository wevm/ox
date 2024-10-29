import { Bytes } from '../../Bytes.js'
import type { Errors } from '../../Errors.js'
import { Base64_toBytes } from './toBytes.js'

/**
 * Decodes a Base64-encoded string (with optional padding and/or URL-safe characters) to a string.
 *
 * @example
 * ```ts twoslash
 * import { Base64 } from 'ox'
 *
 * const value = Base64.toString('aGVsbG8gd29ybGQ=')
 * // @log: 'hello world'
 * ```
 *
 * @param value - The string, hex value, or byte array to encode.
 * @returns The Base64 decoded string.
 */
export function Base64_toString(value: string): string {
  return Bytes.toString(Base64_toBytes(value))
}

export declare namespace Base64_toString {
  type ErrorType = Base64_toBytes.ErrorType | Errors.GlobalErrorType
}

Base64_toString.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Base64_toString.ErrorType
