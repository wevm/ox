import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../types/data.js'
import type { TransactionEnvelope } from '../types/transactionEnvelope.js'
import { TransactionEnvelope_hash } from './hash.js'

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
 */
export function TransactionEnvelope_getSignPayload(
  envelope: TransactionEnvelope,
): TransactionEnvelope_getSignPayload.ReturnType {
  return TransactionEnvelope_hash(envelope, { presign: true })
}

export declare namespace TransactionEnvelope_getSignPayload {
  type ReturnType = Hex

  type ErrorType = TransactionEnvelope_hash.ErrorType | GlobalErrorType
}

TransactionEnvelope_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_getSignPayload.ErrorType
