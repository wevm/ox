import type { GlobalErrorType } from '../../Errors/error.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip7702_assert } from './assert.js'
import type { TransactionEnvelopeEip7702 } from './types.js'

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
export function TransactionEnvelopeEip7702_validate(
  envelope: PartialBy<TransactionEnvelopeEip7702, 'type'>,
) {
  try {
    TransactionEnvelopeEip7702_assert(envelope)
    return true
  } catch {
    return false
  }
}

export declare namespace TransactionEnvelopeEip7702_validate {
  type ErrorType = GlobalErrorType
}

TransactionEnvelopeEip7702_validate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip7702_validate.ErrorType
