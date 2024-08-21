import type { GlobalErrorType } from '../errors/error.js'
import { assertHex } from '../hex/assertHex.js'
import type { Hex } from '../types/data.js'

/**
 * Checks if the given value is {@link Hex}.
 *
 * - Docs: https://oxlib.sh/api/hex/isHex
 *
 * @example
 * import { Hex } from 'ox'
 * Hex.isHex('0x') // true
 * Hex.isHex(Bytes.from([1, 2, 3])) // false
 */
export function isHex(
  value: unknown,
  options: isHex.Options = {},
): value is Hex {
  const { strict = true } = options
  try {
    assertHex(value, { strict })
    return true
  } catch {
    return false
  }
}

export declare namespace isHex {
  type Options = {
    strict?: boolean | undefined
  }

  type ErrorType = GlobalErrorType
}

isHex.parseError = (error: unknown) => error as isHex.ErrorType
