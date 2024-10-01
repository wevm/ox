import type { GlobalErrorType } from '../../Errors/error.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip2930_assert } from './assert.js'
import type { TransactionEnvelopeEip2930 } from './types.js'

/**
 * Validates a {@link ox#TransactionEnvelopeEip2930.TransactionEnvelope}. Returns `true` if the envelope is valid, `false` otherwise.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip2930, Value } from 'ox'
 *
 * const valid = TransactionEnvelopeEip2930.assert({
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
export function TransactionEnvelopeEip2930_validate(
  envelope: PartialBy<TransactionEnvelopeEip2930, 'type'>,
) {
  try {
    TransactionEnvelopeEip2930_assert(envelope)
    return true
  } catch {
    return false
  }
}

export declare namespace TransactionEnvelopeEip2930_validate {
  type ErrorType = GlobalErrorType
}

TransactionEnvelopeEip2930_validate.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip2930_validate.ErrorType
