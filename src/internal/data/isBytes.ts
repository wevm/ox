import type { ErrorType } from '../errors/error.js'
import type { Bytes } from '../types/data.js'

export type IsBytesErrorType = ErrorType

/**
 * Checks if the given value is {@link Bytes}.
 *
 * @example
 * import { Bytes } from 'ox'
 * Bytes.isBytes('0x') // false
 * Bytes.isBytes(Uint8Array.from([1, 2, 3])) // true
 */
export function isBytes(value: unknown): value is Bytes {
  if (!value) return false
  if (typeof value !== 'object') return false
  if (!('BYTES_PER_ELEMENT' in value)) return false
  return (
    value.BYTES_PER_ELEMENT === 1 && value.constructor.name === 'Uint8Array'
  )
}
