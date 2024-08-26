import type { GlobalErrorType } from '../../errors/error.js'
import type { Hex } from '../../hex/types.js'
import { TransactionEnvelopeEip4844_hash } from './hash.js'
import type { TransactionEnvelopeEip4844 } from './types.js'

/**
 * Returns the payload to sign for a {@link TransactionEnvelope#Eip4844}.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeEip4844_getSignPayload(
  envelope: TransactionEnvelopeEip4844,
): TransactionEnvelopeEip4844_getSignPayload.ReturnType {
  return TransactionEnvelopeEip4844_hash(envelope, { presign: true })
}

export declare namespace TransactionEnvelopeEip4844_getSignPayload {
  type ReturnType = Hex

  type ErrorType = TransactionEnvelopeEip4844_hash.ErrorType | GlobalErrorType
}

TransactionEnvelopeEip4844_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip4844_getSignPayload.ErrorType
