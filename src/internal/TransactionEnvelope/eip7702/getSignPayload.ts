import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeEip7702_hash } from './hash.js'
import type { TransactionEnvelopeEip7702 } from './types.js'

/**
 * Returns the payload to sign for a {@link ox#TransactionEnvelope.Eip7702}.
 *
 * @example
 * The example below demonstrates how to compute the sign payload which can be used
 * with ECDSA signing utilities like {@link ox#Secp256k1.(sign:function)}.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1, TransactionEnvelopeEip7702 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip7702.from({
 *   authorizationList: [...],
 *   chainId: 1,
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const payload = TransactionEnvelopeEip7702.getSignPayload(envelope) // [!code focus]
 * // @log: '0x...'
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param envelope - The transaction envelope to get the sign payload for.
 * @returns The sign payload.
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
