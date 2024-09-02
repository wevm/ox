import { AccessList_toTupleList } from '../../AccessList/toTupleList.js'
import { Authorization_toTupleList } from '../../Authorization/toTupleList.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import { Hex_concat } from '../../Hex/concat.js'
import { Hex_from } from '../../Hex/from.js'
import { Rlp_fromHex } from '../../Rlp/from.js'
import { Signature_extract } from '../../Signature/extract.js'
import { Signature_toTuple } from '../../Signature/toTuple.js'
import type { Signature } from '../../Signature/types.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip7702_assert } from './assert.js'
import { TransactionEnvelopeEip7702_serializedType } from './constants.js'
import type {
  TransactionEnvelopeEip7702,
  TransactionEnvelopeEip7702_Serialized,
} from './types.js'

/**
 * Serializes a {@link TransactionEnvelope#Eip7702}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Authorization, Secp256k1, TransactionEnvelopeEip7702, Value } from 'ox'
 *
 * const authorization = Authorization.from({
 *   chainId: 1,
 *   contractAddress: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   nonce: 0n,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: Authorization.getSignPayload(authorization),
 *   privateKey: '0x...',
 * })
 *
 * const authorizationList = [Authorization.from(authorization, { signature })]
 *
 * const envelope = TransactionEnvelopeEip7702.from({
 *   authorizationList,
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const serialized = TransactionEnvelopeEip7702.serialize(envelope) // [!code focus]
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the serialized Transaction Envelope.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1, TransactionEnvelopeEip7702, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip7702.from({
 *   authorizationList: [...],
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelopeEip7702.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const serialized = TransactionEnvelopeEip7702.serialize(envelope, { // [!code focus]
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
export function TransactionEnvelopeEip7702_serialize(
  envelope: PartialBy<TransactionEnvelopeEip7702, 'type'>,
  options: TransactionEnvelopeEip7702_serialize.Options = {},
): TransactionEnvelopeEip7702_Serialized {
  const {
    authorizationList,
    chainId,
    gas,
    nonce,
    to,
    value,
    maxFeePerGas,
    maxPriorityFeePerGas,
    accessList,
    data,
    input,
  } = envelope

  TransactionEnvelopeEip7702_assert(envelope)

  const accessTupleList = AccessList_toTupleList(accessList)
  const authorizationTupleList = Authorization_toTupleList(authorizationList)

  const signature = Signature_extract(options.signature || envelope)

  const serializedTransaction = [
    Hex_from(chainId),
    nonce ? Hex_from(nonce) : '0x',
    maxPriorityFeePerGas ? Hex_from(maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? Hex_from(maxFeePerGas) : '0x',
    gas ? Hex_from(gas) : '0x',
    to ?? '0x',
    value ? Hex_from(value) : '0x',
    data ?? input ?? '0x',
    accessTupleList,
    authorizationTupleList,
    ...(signature ? Signature_toTuple(signature) : []),
  ]

  return Hex_concat(
    TransactionEnvelopeEip7702_serializedType,
    Rlp_fromHex(serializedTransaction),
  ) as TransactionEnvelopeEip7702_Serialized
}

export declare namespace TransactionEnvelopeEip7702_serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ErrorType =
    | TransactionEnvelopeEip7702_assert.ErrorType
    | Hex_from.ErrorType
    | Signature_toTuple.ErrorType
    | Hex_concat.ErrorType
    | Rlp_fromHex.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip7702_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip7702_serialize.ErrorType
