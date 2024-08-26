import type { GlobalErrorType } from '../../errors/error.js'
import type { Hex } from '../../hex/types.js'
import { TransactionEnvelopeLegacy_hash } from './hash.js'
import type { TransactionEnvelopeLegacy } from './types.js'

/**
 * Returns the payload to sign for a {@link TransactionEnvelope#Legacy}.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeLegacy_getSignPayload(
  envelope: TransactionEnvelopeLegacy,
): TransactionEnvelopeLegacy_getSignPayload.ReturnType {
  return TransactionEnvelopeLegacy_hash(envelope, { presign: true })
}

export declare namespace TransactionEnvelopeLegacy_getSignPayload {
  type ReturnType = Hex

  type ErrorType = TransactionEnvelopeLegacy_hash.ErrorType | GlobalErrorType
}

TransactionEnvelopeLegacy_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeLegacy_getSignPayload.ErrorType
