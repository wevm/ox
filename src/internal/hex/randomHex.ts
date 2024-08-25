import { randomBytes } from '../bytes/randomBytes.js'
import type { GlobalErrorType } from '../errors/error.js'
import { bytesToHex } from '../hex/toHex.js'
import type { Hex } from '../types/data.js'

/**
 * Generates a random Hex value of the specified length.
 *
 * - Docs: https://oxlib.sh/api/hex/random
 *
 * @example
 * ```ts
 * import { Hex } from 'ox'
 * const hex = Hex.random(32)
 * ```
 *
 * @alias ox!Hex.randomHex:function(1)
 */
export function randomHex(length: number): Hex {
  return bytesToHex(randomBytes(length))
}

export declare namespace randomHex {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
randomHex.parseError = (error: unknown) => error as randomHex.ErrorType
