import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeEip2930_hash } from './hash.js'
import type { TransactionEnvelopeEip2930 } from './types.js'

/**
 * Returns the payload to sign for a {@link ox#TransactionEnvelope.Eip2930}.
 *
 * @example
 * The example below demonstrates how to compute the sign payload which can be used
 * with ECDSA signing utilities like {@link ox#Secp256k1.sign}.
 *
 * ```ts twoslash
 * import { Secp256k1, TransactionEnvelopeEip2930 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip2930.from({
 *   chainId: 1,
 *   nonce: 0n,
 *   gasPrice: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const payload = TransactionEnvelopeEip2930.getSignPayload(envelope) // [!code focus]
 * // @log: '0x...'
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param envelope - The transaction envelope to get the sign payload for.
 * @returns The sign payload.
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
