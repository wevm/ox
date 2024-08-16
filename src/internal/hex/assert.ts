import { InvalidHexTypeError, InvalidHexValueError } from '../errors/data.js'
import type { ErrorType as ErrorType_ } from '../errors/error.js'
import type { Hex } from '../types/data.js'

export declare namespace assertHex {
  type Options = {
    strict?: boolean | undefined
  }

  type ErrorType = InvalidHexTypeError | InvalidHexValueError | ErrorType_
}

/**
 * Asserts if the given value is {@link Hex}.
 *
 * - Docs: https://oxlib.sh/api/hex/assert
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.assert('abc')
 * // InvalidHexValueTypeError: Value `"abc"` of type `string` is an invalid hex type. Hex types must be represented as `"0x\${string}"`.
 */
export function assertHex(
  value: unknown,
  options: assertHex.Options = {},
): asserts value is Hex {
  const { strict = true } = options
  if (!value) throw new InvalidHexTypeError(value)
  if (typeof value !== 'string') throw new InvalidHexTypeError(value)
  if (strict) {
    if (!/^0x[0-9a-fA-F]*$/.test(value)) throw new InvalidHexValueError(value)
  }
  if (!value.startsWith('0x')) throw new InvalidHexValueError(value)
}
