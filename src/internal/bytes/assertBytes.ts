import { InvalidBytesTypeError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

/**
 * Asserts if the given value is {@link Types#Bytes}.
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
export function assertBytes(value: unknown): asserts value is Bytes {
  if (!value) throw new InvalidBytesTypeError(value)
  if (typeof value !== 'object') throw new InvalidBytesTypeError(value)
  if (!('BYTES_PER_ELEMENT' in value)) throw new InvalidBytesTypeError(value)
  if (value.BYTES_PER_ELEMENT !== 1 || value.constructor.name !== 'Uint8Array')
    throw new InvalidBytesTypeError(value)
}

export declare namespace assertBytes {
  type ErrorType = InvalidBytesTypeError | GlobalErrorType
}

assertBytes.parseError = (error: unknown) => error as assertBytes.ErrorType
