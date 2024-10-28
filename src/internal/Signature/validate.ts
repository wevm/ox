import type { Errors } from '../../Errors.js'
import type { ExactPartial } from '../types.js'
import { Signature_assert } from './assert.js'
import type { Signature } from './types.js'

/**
 * Validates a Signature. Returns `true` if the signature is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { Signature } from 'ox'
 *
 * const valid = Signature.validate({
 *   r: -49782753348462494199823712700004552394425719014458918871452329774910450607807n,
 *   s: 33726695977844476214676913201140481102225469284307016937915595756355928419768n,
 *   yParity: 1,
 * })
 * // @log: false
 * ```
 *
 * @param signature - The signature object to assert.
 */
export function Signature_validate(
  signature: ExactPartial<Signature>,
  options: Signature_validate.Options = {},
): boolean {
  try {
    Signature_assert(signature, options)
    return true
  } catch {
    return false
  }
}

export declare namespace Signature_validate {
  type Options = {
    /** Whether or not the signature should be recovered (contain `yParity`). */
    recovered?: boolean
  }

  type ErrorType = Errors.GlobalErrorType
}
