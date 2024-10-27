import type * as Errors from '../../../Errors.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip1559_assert } from './assert.js'
import type { TransactionEnvelopeEip1559 } from './types.js'

/**
 * Validates a {@link ox#TransactionEnvelopeEip1559.TransactionEnvelope}. Returns `true` if the envelope is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip1559, Value } from 'ox'
 *
 * const valid = TransactionEnvelopeEip1559.assert({
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
export function TransactionEnvelopeEip1559_validate(
  envelope: PartialBy<TransactionEnvelopeEip1559, 'type'>,
) {
  try {
    TransactionEnvelopeEip1559_assert(envelope)
    return true
  } catch {
    return false
  }
}

export declare namespace TransactionEnvelopeEip1559_validate {
  type ErrorType = Errors.GlobalErrorType
}

TransactionEnvelopeEip1559_validate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip1559_validate.ErrorType
