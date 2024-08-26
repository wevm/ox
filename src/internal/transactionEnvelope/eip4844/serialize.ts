import { AccessList_toTupleList } from '../../accessList/toTupleList.js'
import type { BlobSidecars } from '../../blobs/types.js'
import type { GlobalErrorType } from '../../errors/error.js'
import { Hex_concat } from '../../hex/concat.js'
import { Hex_from } from '../../hex/from.js'
import type { Hex } from '../../hex/types.js'
import { Rlp_fromHex } from '../../rlp/from.js'
import { Signature_extract } from '../../signature/extract.js'
import { Signature_toTuple } from '../../signature/toTuple.js'
import type { Signature } from '../../signature/types.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip4844_assert } from './assert.js'
import type {
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip4844_Serialized,
} from './types.js'

/**
 * Serializes a {@link TransactionEnvelope#Eip4844}.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeEip4844_serialize(
  envelope: PartialBy<TransactionEnvelopeEip4844, 'type'>,
  options: TransactionEnvelopeEip4844_serialize.Options = {},
): TransactionEnvelopeEip4844_serialize.ReturnType {
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

  type ReturnType = TransactionEnvelopeEip4844_Serialized

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
