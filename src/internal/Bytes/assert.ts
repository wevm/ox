import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'

/**
 * Asserts if the given value is {@link ox#Bytes.Bytes}.
 *
 * @example
 * ```ts twoslash
 * import { Bytes } from 'ox'
 *
 * Bytes.assert('abc')
 * // @error: InvalidBytesTypeError:
 * // @error: Value `"abc"` of type `string` is an invalid Bytes value.
 * // @error: Bytes values must be of type `Uint8Array`.
 * ```
 *
 * @param value - Value to assert.
 */
export function assert(value: unknown): asserts value is Bytes.Bytes {
  if (value instanceof Uint8Array) return
  if (!value) throw new Bytes.InvalidBytesTypeError(value)
  if (typeof value !== 'object') throw new Bytes.InvalidBytesTypeError(value)
  if (!('BYTES_PER_ELEMENT' in value))
    throw new Bytes.InvalidBytesTypeError(value)
  if (value.BYTES_PER_ELEMENT !== 1 || value.constructor.name !== 'Uint8Array')
    throw new Bytes.InvalidBytesTypeError(value)
}

export declare namespace assert {
  type ErrorType = Bytes.InvalidBytesTypeError | Errors.GlobalErrorType
}

/* v8 ignore next */
assert.parseError = (error: unknown) => error as Bytes.assert.ErrorType
