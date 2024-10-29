import type * as Errors from '../../Errors.js'
import type { ExactPartial } from '../types.js'
import { PublicKey_assert } from './assert.js'
import type { PublicKey } from './types.js'

/**
 * Validates a {@link ox#PublicKey.PublicKey}. Returns `true` if valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { PublicKey } from 'ox'
 *
 * const valid = PublicKey.validate({
 *   prefix: 4,
 *   y: 49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 * })
 * // @log: false
 * ```
 *
 * @param publicKey - The public key object to assert.
 */
export function PublicKey_validate(
  publicKey: ExactPartial<PublicKey>,
  options: PublicKey_validate.Options = {},
): boolean {
  try {
    PublicKey_assert(publicKey, options)
    return true
  } catch (error) {
    return false
  }
}

export declare namespace PublicKey_validate {
  type Options = {
    /** Whether or not the public key should be compressed. */
    compressed?: boolean
  }

  type ErrorType = Errors.GlobalErrorType
}
