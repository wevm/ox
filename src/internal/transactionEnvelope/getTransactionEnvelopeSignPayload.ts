import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'
import type { TransactionEnvelope } from '../types/transactionEnvelope.js'
import { hashTransactionEnvelope } from './hashTransactionEnvelope.js'

/**
 * Returns the payload to sign for a transaction envelope.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   nonce: 0,
 *   gasPrice: 1000000000n,
 *   gasLimit: 21000,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 *   data: '0x',
 * })
 *
 * const payload = TransactionEnvelope.getSignPayload(envelope)
 * // '0x...'
 * ```
 *
 * @alias ox!TransactionEnvelope.getTransactionEnvelopeSignPayload:function(1)
 */
export function getTransactionEnvelopeSignPayload(
  envelope: TransactionEnvelope,
): getTransactionEnvelopeSignPayload.ReturnType {
  return hashTransactionEnvelope({
    ...envelope,
    sidecars: undefined,
    r: undefined,
    s: undefined,
    yParity: undefined,
    v: undefined,
  })
}

export declare namespace getTransactionEnvelopeSignPayload {
  type ReturnType = Hex

  type ErrorType = hashTransactionEnvelope.ErrorType | GlobalErrorType
}

getTransactionEnvelopeSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as getTransactionEnvelopeSignPayload.ErrorType
