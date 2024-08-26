import type { GlobalErrorType } from '../../errors/error.js'
import type { Hex } from '../../hex/types.js'
import { TransactionEnvelopeEip2930_hash } from './hash.js'
import type { TransactionEnvelopeEip2930 } from './types.js'

/**
 * Returns the payload to sign for a {@link TransactionEnvelope#Eip2930}.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeEip2930_getSignPayload(
  envelope: TransactionEnvelopeEip2930,
): TransactionEnvelopeEip2930_getSignPayload.ReturnType {
  return TransactionEnvelopeEip2930_hash(envelope, { presign: true })
}

export declare namespace TransactionEnvelopeEip2930_getSignPayload {
  type ReturnType = Hex

  type ErrorType = TransactionEnvelopeEip2930_hash.ErrorType | GlobalErrorType
}

TransactionEnvelopeEip2930_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip2930_getSignPayload.ErrorType
