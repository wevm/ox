import * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { PartialBy } from '../../types.js'

/**
 * Validates a {@link ox#TransactionEnvelopeEip4844.TransactionEnvelope}. Returns `true` if the envelope is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip4844, Value } from 'ox'
 *
 * const valid = TransactionEnvelopeEip4844.assert({
 *   blobVersionedHashes: [],
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
  envelope: PartialBy<TransactionEnvelopeEip4844.TransactionEnvelope, 'type'>,
) {
  try {
    TransactionEnvelopeEip4844.assert(envelope)
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
