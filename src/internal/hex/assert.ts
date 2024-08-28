import { InvalidHexTypeError, InvalidHexValueError } from '../errors/data.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../hex/types.js'

/**
 * Asserts if the given value is {@link Hex#Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.assert('abc')
 * // @error: InvalidHexValueTypeError:
 * // @error: Value `"abc"` of type `string` is an invalid hex type.
 * // @error: Hex types must be represented as `"0x\${string}"`.
 * ```
 *
 * @param value - The value to assert.
 * @param options -
 */
export function Hex_assert(
  value: unknown,
  options: Hex_assert.Options = {},
): asserts value is Hex {
  const { strict = true } = options
  if (!value) throw new InvalidHexTypeError(value)
  if (typeof value !== 'string') throw new InvalidHexTypeError(value)
  if (strict) {
    if (!/^0x[0-9a-fA-F]*$/.test(value)) throw new InvalidHexValueError(value)
  }
  if (!value.startsWith('0x')) throw new InvalidHexValueError(value)
}

export declare namespace Hex_assert {
  type Options = {
    /** Checks if the {@link Hex#Hex} value contains invalid hexadecimal characters. @default true */
    strict?: boolean | undefined
  }

  type ErrorType = InvalidHexTypeError | InvalidHexValueError | GlobalErrorType
}

/* v8 ignore next */
Hex_assert.parseError = (error: unknown) => error as Hex_assert.ErrorType
