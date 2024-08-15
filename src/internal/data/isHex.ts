import type { ErrorType as ErrorType_ } from '../errors/error.js'
import type { Hex } from '../types/data.js'

/**
 * Checks if the given value is {@link Hex}.
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.isHex('0x') // true
 * Hex.isHex(Bytes.from([1, 2, 3])) // false
 */
export declare namespace isHex {
  type Options = {
    strict?: boolean | undefined
  }

  type ErrorType = ErrorType_
}
export function isHex(
  value: unknown,
  options: isHex.Options = {},
): value is Hex {
  const { strict = true } = options
  if (!value) return false
  if (typeof value !== 'string') return false
  return strict ? /^0x[0-9a-fA-F]*$/.test(value) : value.startsWith('0x')
}
