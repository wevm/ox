import type { GlobalErrorType } from '../Errors/error.js'
import { Bytes_InvalidBytesTypeError } from './errors.js'
import type { Bytes } from './types.js'

/**
 * Asserts if the given value is {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.assert('abc')
 * // @error: Bytes_InvalidBytesTypeError:
 * // @error: Value `"abc"` of type `string` is an invalid Bytes value.
 * // @error: Bytes values must be of type `Uint8Array`.
 * ```
 *
 * @param value - Value to assert.
 */
export function Bytes_assert(value: unknown): asserts value is Bytes {
  if (value instanceof Uint8Array) return
  if (!value) throw new Bytes_InvalidBytesTypeError(value)
  if (typeof value !== 'object') throw new Bytes_InvalidBytesTypeError(value)
  if (!('BYTES_PER_ELEMENT' in value))
    throw new Bytes_InvalidBytesTypeError(value)
  if (value.BYTES_PER_ELEMENT !== 1 || value.constructor.name !== 'Uint8Array')
    throw new Bytes_InvalidBytesTypeError(value)
}

export declare namespace Bytes_assert {
  type ErrorType = Bytes_InvalidBytesTypeError | GlobalErrorType
}

/* v8 ignore next */
Bytes_assert.parseError = (error: unknown) => error as Bytes_assert.ErrorType
