import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeEip4844_hash } from './hash.js'
import type { TransactionEnvelopeEip4844 } from './types.js'

/**
 * Returns the payload to sign for a {@link TransactionEnvelope#Eip4844}.
 *
 * @example
 * The example below demonstrates how to compute the sign payload which can be used
 * with ECDSA signing utilities like {@link Secp256k1#sign}.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs, Secp256k1, TransactionEnvelopeEip4844 } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const blobVersionedHashes = Blobs.toVersionedHashes(blobs, { kzg })
 *
 * const envelope = TransactionEnvelopeEip4844.from({
 *   blobVersionedHashes,
 *   chainId: 1,
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const payload = TransactionEnvelopeEip4844.getSignPayload(envelope) // [!code focus]
 * // @log: '0x...'
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param envelope - The transaction envelope to get the sign payload for.
 * @returns The sign payload.
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
