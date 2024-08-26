import type { GlobalErrorType } from '../../errors/error.js'
import type { Hex } from '../../hex/types.js'
import { TransactionEnvelopeEip1559_hash } from './hash.js'
import type { TransactionEnvelopeEip1559 } from './types.js'

/**
 * Returns the payload to sign for a {@link TransactionEnvelope#Eip1559}.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeEip1559_getSignPayload(
  envelope: TransactionEnvelopeEip1559,
): TransactionEnvelopeEip1559_getSignPayload.ReturnType {
  return TransactionEnvelopeEip1559_hash(envelope, { presign: true })
}

export declare namespace TransactionEnvelopeEip1559_getSignPayload {
  type ReturnType = Hex

  type ErrorType = TransactionEnvelopeEip1559_hash.ErrorType | GlobalErrorType
}

TransactionEnvelopeEip1559_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip1559_getSignPayload.ErrorType
