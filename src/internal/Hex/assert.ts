import * as Errors from '../../Errors.js'
import type * as Hex from '../../Hex.js'

/**
 * Asserts if the given value is {@link ox#Hex.Hex}.
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
 * @param options - Assertion options.
 */
export function assert(
  value: unknown,
  options: Hex.assert.Options = {},
): asserts value is Hex.Hex {
  const { strict = true } = options
  if (!value) throw new Errors.InvalidHexTypeError(value)
  if (typeof value !== 'string') throw new Errors.InvalidHexTypeError(value)
  if (strict) {
    if (!/^0x[0-9a-fA-F]*$/.test(value))
      throw new Errors.InvalidHexValueError(value)
  }
  if (!value.startsWith('0x')) throw new Errors.InvalidHexValueError(value)
}

export declare namespace assert {
  type Options = {
    /** Checks if the {@link ox#Hex.Hex} value contains invalid hexadecimal characters. @default true */
    strict?: boolean | undefined
  }

  type ErrorType =
    | Errors.InvalidHexTypeError
    | Errors.InvalidHexValueError
    | Errors.GlobalErrorType
}

/* v8 ignore next */
assert.parseError = (error: unknown) => error as Hex.assert.ErrorType
