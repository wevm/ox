import * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { PartialBy } from '../../types.js'

/**
 * Validates a {@link ox#TransactionEnvelopeEip7702.TransactionEnvelope}. Returns `true` if the envelope is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip7702, Value } from 'ox'
 *
 * const valid = TransactionEnvelopeEip7702.validate({
 *   authorizationList: [],
 *   maxFeePerGas: 2n ** 256n - 1n + 1n,
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
  envelope: PartialBy<TransactionEnvelopeEip7702.TransactionEnvelope, 'type'>,
) {
  try {
    TransactionEnvelopeEip7702.assert(envelope)
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
