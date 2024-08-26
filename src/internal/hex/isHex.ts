import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'
import { Hex_assert } from './assert.js'

/**
 * Checks if the given value is {@link Types#Hex}.
 *
 * - Docs: https://oxlib.sh/api/hex/isHex
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * Hex.isHex('0x') // true
 * Hex.isHex(Bytes.from([1, 2, 3])) // false
 * ```
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
    strict?: boolean | undefined
  }

  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Hex_isHex.parseError = (error: unknown) => error as Hex_isHex.ErrorType
