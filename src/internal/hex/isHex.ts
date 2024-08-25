import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'
import { assertHex } from './assertHex.js'

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

/* v8 ignore next */
isHex.parseError = (error: unknown) => error as isHex.ErrorType
