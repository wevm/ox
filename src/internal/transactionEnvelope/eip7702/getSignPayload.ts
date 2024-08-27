import type { GlobalErrorType } from '../../errors/error.js'
import type { Hex } from '../../hex/types.js'
import { TransactionEnvelopeEip7702_hash } from './hash.js'
import type { TransactionEnvelopeEip7702 } from './types.js'

/**
 * Returns the payload to sign for a {@link TransactionEnvelope#Eip7702}.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeEip7702_getSignPayload(
  envelope: TransactionEnvelopeEip7702,
): TransactionEnvelopeEip7702_getSignPayload.ReturnType {
  return TransactionEnvelopeEip7702_hash(envelope, { presign: true })
}

export declare namespace TransactionEnvelopeEip7702_getSignPayload {
  type ReturnType = Hex

  type ErrorType = TransactionEnvelopeEip7702_hash.ErrorType | GlobalErrorType
}

TransactionEnvelopeEip7702_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip7702_getSignPayload.ErrorType
