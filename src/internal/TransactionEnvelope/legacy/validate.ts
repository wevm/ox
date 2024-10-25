import * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { PartialBy } from '../../types.js'

/**
 * Validates a {@link ox#TransactionEnvelopeLegacy.TransactionEnvelope}. Returns `true` if the envelope is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeLegacy, Value } from 'ox'
 *
 * const valid = TransactionEnvelopeLegacy.assert({
 *   gasPrice: 2n ** 256n - 1n + 1n,
 *   chainId: 1,
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * // @log: false
 * ```
 *
 * @param envelope - The transaction envelope to validate.
 */
export function validate(
  envelope: PartialBy<TransactionEnvelopeLegacy.TransactionEnvelope, 'type'>,
) {
  try {
    TransactionEnvelopeLegacy.assert(envelope)
    return true
  } catch {
    return false
  }
}

export declare namespace validate {
  type ErrorType = GlobalErrorType
}

validate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as validate.ErrorType
