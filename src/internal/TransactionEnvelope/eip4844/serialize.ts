import { AccessList_toTupleList } from '../../AccessList/toTupleList.js'
import type { BlobSidecars } from '../../Blobs/types.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import { Hex_concat } from '../../Hex/concat.js'
import { Hex_from } from '../../Hex/from.js'
import type { Hex } from '../../Hex/types.js'
import { Rlp_fromHex } from '../../Rlp/from.js'
import { Signature_extract } from '../../Signature/extract.js'
import { Signature_toTuple } from '../../Signature/toTuple.js'
import type { Signature } from '../../Signature/types.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip4844_assert } from './assert.js'
import type {
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip4844_Serialized,
} from './types.js'

/**
 * Serializes a {@link ox#TransactionEnvelope.Eip4844}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs, TransactionEnvelopeEip4844 } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const blobVersionedHashes = Blobs.toVersionedHashes(blobs, { kzg })
 *
 * const envelope = TransactionEnvelopeEip4844.from({
 *   blobVersionedHashes,
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const serialized = TransactionEnvelopeEip4844.serialize(envelope) // [!code focus]
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the serialized Transaction Envelope.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Blobs, Secp256k1, TransactionEnvelopeEip4844, Value } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const sidecars = Blobs.toSidecars(blobs, { kzg })
 * const blobVersionedHashes = Blobs.sidecarsToVersionedHashes(blobs)
 *
 * const envelope = TransactionEnvelopeEip4844.from({
 *   blobVersionedHashes,
 *   chainId: 1,
 *   maxFeePerBlobGas: Value.fromGwei('3'),
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelopeEip4844.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const serialized = TransactionEnvelopeEip4844.serialize(envelope, { // [!code focus]
 *   sidecars, // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 *
 * // ... send `serialized` transaction to JSON-RPC `eth_sendRawTransaction`
 * ```
 *
 * @param envelope - The Transaction Envelope to serialize.
 * @param options -
 * @returns The serialized Transaction Envelope.
 */
export function TransactionEnvelopeEip4844_serialize(
  envelope: PartialBy<TransactionEnvelopeEip4844, 'type'>,
  options: TransactionEnvelopeEip4844_serialize.Options = {},
): TransactionEnvelopeEip4844_Serialized {
  const {
    blobVersionedHashes,
    chainId,
    gas,
    nonce,
    to,
    value,
    maxFeePerBlobGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    accessList,
    data,
  } = envelope

  TransactionEnvelopeEip4844_assert(envelope)

  const accessTupleList = AccessList_toTupleList(accessList)

  const signature = Signature_extract(options.signature || envelope)

  const serializedTransaction = [
    Hex_from(chainId),
    nonce ? Hex_from(nonce) : '0x',
    maxPriorityFeePerGas ? Hex_from(maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? Hex_from(maxFeePerGas) : '0x',
    gas ? Hex_from(gas) : '0x',
    to ?? '0x',
    value ? Hex_from(value) : '0x',
    data ?? '0x',
    accessTupleList,
    maxFeePerBlobGas ? Hex_from(maxFeePerBlobGas) : '0x',
    blobVersionedHashes ?? [],
    ...(signature ? Signature_toTuple(signature) : []),
  ] as const

  const sidecars = options.sidecars || envelope.sidecars
  const blobs: Hex[] = []
  const commitments: Hex[] = []
  const proofs: Hex[] = []
  if (sidecars)
    for (let i = 0; i < sidecars.length; i++) {
      const { blob, commitment, proof } = sidecars[i]!
      blobs.push(blob)
      commitments.push(commitment)
      proofs.push(proof)
    }

  return Hex_concat(
    '0x03',
    sidecars
      ? // If sidecars are provided, envelope turns into a "network wrapper":
        Rlp_fromHex([serializedTransaction, blobs, commitments, proofs])
      : // Otherwise, standard envelope is used:
        Rlp_fromHex(serializedTransaction),
  ) as TransactionEnvelopeEip4844_Serialized
}

export declare namespace TransactionEnvelopeEip4844_serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
    /** Sidecars to append to the serialized Transaction Envelope. */
    sidecars?: BlobSidecars<Hex> | undefined
  }

  type ErrorType =
    | TransactionEnvelopeEip4844_assert.ErrorType
    | Hex_from.ErrorType
    | Signature_toTuple.ErrorType
    | Hex_concat.ErrorType
    | Rlp_fromHex.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip4844_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip4844_serialize.ErrorType
