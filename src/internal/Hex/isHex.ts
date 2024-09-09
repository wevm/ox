import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_assert } from './assert.js'
import type { Hex } from './types.js'

/**
 * Checks if the given value is {@link ox#Hex.Hex}.
 *
 * @example
 * ```ts twoslash
 * import { Hex } from 'ox'
 *
 * Hex.isHex('0x')
 * // @log: true
 *
 * Hex.isHex(Bytes.from([1, 2, 3]))
 * // @log: false
 * ```
 *
 * @param value - The value to check.
 * @param options -
 * @returns `true` if the value is a {@link ox#Hex.Hex}, `false` otherwise.
 */
export function Hex_isHex(
  value: unknown,
  options: Hex_isHex.Options = {},
): value is Hex {
  const { strict = true } = options
  try {
    Hex_assert(value, { strict })
    return true
  } catch {
    return false
  }
}

export declare namespace Hex_isHex {
  type Options = {
    /** Checks if the {@link ox#Hex.Hex} value contains invalid hexadecimal characters. @default true */
    strict?: boolean | undefined
  }

  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Hex_isHex.parseError = (error: unknown) => error as Hex_isHex.ErrorType
