import type { Bytes } from '../bytes/types.js'
import { InvalidBytesTypeError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'

/**
 * Asserts if the given value is {@link Bytes#Bytes}.
 *
 * - Docs: https://oxlib.sh/api/bytes/assert
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * Bytes.assert('abc')
 * // InvalidBytesTypeError: Value \`"abc"\` of type \`string\` is an invalid Bytes value. Bytes values must be of type \`Uint8Array\`.
 * ```
 */
export function Bytes_assert(value: unknown): asserts value is Bytes {
  if (!value) throw new InvalidBytesTypeError(value)
  if (typeof value !== 'object') throw new InvalidBytesTypeError(value)
  if (!('BYTES_PER_ELEMENT' in value)) throw new InvalidBytesTypeError(value)
  if (value.BYTES_PER_ELEMENT !== 1 || value.constructor.name !== 'Uint8Array')
    throw new InvalidBytesTypeError(value)
}

export declare namespace Bytes_assert {
  type ErrorType = InvalidBytesTypeError | GlobalErrorType
}

/* v8 ignore next */
Bytes_assert.parseError = (error: unknown) => error as Bytes_assert.ErrorType
