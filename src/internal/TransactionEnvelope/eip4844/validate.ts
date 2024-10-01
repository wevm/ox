import type { GlobalErrorType } from '../../Errors/error.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip4844_assert } from './assert.js'
import type { TransactionEnvelopeEip4844 } from './types.js'

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
export function TransactionEnvelopeEip4844_validate(
  envelope: PartialBy<TransactionEnvelopeEip4844, 'type'>,
) {
  try {
    TransactionEnvelopeEip4844_assert(envelope)
    return true
  } catch {
    return false
  }
}

export declare namespace TransactionEnvelopeEip4844_validate {
  type ErrorType = GlobalErrorType
}

TransactionEnvelopeEip4844_validate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip4844_validate.ErrorType
