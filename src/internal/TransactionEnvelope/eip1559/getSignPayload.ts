import type { Errors } from '../../../Errors.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeEip1559_hash } from './hash.js'
import type { TransactionEnvelopeEip1559 } from './types.js'

/**
 * Returns the payload to sign for a {@link ox#TransactionEnvelopeEip1559.TransactionEnvelope}.
 *
 * @example
 * The example below demonstrates how to compute the sign payload which can be used
 * with ECDSA signing utilities like {@link ox#Secp256k1.(sign:function)}.
 *
 * ```ts twoslash
 * import { Secp256k1, TransactionEnvelopeEip1559 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip1559.from({
 *   chainId: 1,
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const payload = TransactionEnvelopeEip1559.getSignPayload(envelope) // [!code focus]
 * // @log: '0x...'
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param envelope - The transaction envelope to get the sign payload for.
 * @returns The sign payload.
 */
export function TransactionEnvelopeEip1559_getSignPayload(
  envelope: TransactionEnvelopeEip1559,
): TransactionEnvelopeEip1559_getSignPayload.ReturnType {
  return TransactionEnvelopeEip1559_hash(envelope, { presign: true })
}

export declare namespace TransactionEnvelopeEip1559_getSignPayload {
  type ReturnType = Hex

  type ErrorType =
    | TransactionEnvelopeEip1559_hash.ErrorType
    | Errors.GlobalErrorType
}

TransactionEnvelopeEip1559_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip1559_getSignPayload.ErrorType
