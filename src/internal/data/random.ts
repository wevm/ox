import type { GlobalErrorType } from '../errors/error.js'
import { bytesToHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

/**
 * Generates a random byte array of the specified length.
 *
 * - Docs: https://oxlib.sh/api/bytes/random
 *
 * @example
 * ```ts
 * import { Bytes } from 'ox'
 * const bytes = Bytes.random(32)
 * ```
 *
 * @example
 * ```ts
 * import { Data } from 'ox'
 * const bytes = Data.randomBytes(32)
 * ```
 *
 * @alias ox!Bytes.randomBytes:function(1)
 */
export function randomBytes(length: number): Bytes {
  return crypto.getRandomValues(new Uint8Array(length))
}

export declare namespace randomBytes {
  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
randomBytes.parseError = (error: unknown) => error as randomBytes.ErrorType

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
 * @example
 * ```ts
 * import { Data } from 'ox'
 * const hex = Data.randomHex(32)
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
