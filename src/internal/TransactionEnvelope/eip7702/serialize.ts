import * as Authorization from '../../../Authorization.js'
import type * as Errors from '../../../Errors.js'
import * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import { AccessList_toTupleList } from '../../AccessList/toTupleList.js'
import { concat } from '../../Hex/concat.js'
import { fromNumber } from '../../Hex/fromNumber.js'
import { Rlp_fromHex } from '../../Rlp/from.js'
import { Signature_extract } from '../../Signature/extract.js'
import { Signature_toTuple } from '../../Signature/toTuple.js'
import type { Signature } from '../../Signature/types.js'
import type { PartialBy } from '../../types.js'

/**
 * Serializes a {@link ox#TransactionEnvelope.Eip7702}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Authorization, Secp256k1, TransactionEnvelopeEip7702, Value } from 'ox'
 *
 * const authorization = Authorization.from({
 *   address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   chainId: 1,
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
export function serialize(
  envelope: PartialBy<TransactionEnvelopeEip7702.TransactionEnvelope, 'type'>,
  options: serialize.Options = {},
): TransactionEnvelopeEip7702.Serialized {
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

  TransactionEnvelopeEip7702.assert(envelope)

  const accessTupleList = AccessList_toTupleList(accessList)
  const authorizationTupleList = Authorization.toTupleList(authorizationList)

  const signature = Signature_extract(options.signature || envelope)

  const serializedTransaction = [
    fromNumber(chainId),
    nonce ? fromNumber(nonce) : '0x',
    maxPriorityFeePerGas ? fromNumber(maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? fromNumber(maxFeePerGas) : '0x',
    gas ? fromNumber(gas) : '0x',
    to ?? '0x',
    value ? fromNumber(value) : '0x',
    data ?? input ?? '0x',
    accessTupleList,
    authorizationTupleList,
    ...(signature ? Signature_toTuple(signature) : []),
  ]

  return concat(
    TransactionEnvelopeEip7702.serializedType,
    Rlp_fromHex(serializedTransaction),
  ) as TransactionEnvelopeEip7702.Serialized
}

export declare namespace serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ErrorType =
    | AccessList_toTupleList.ErrorType
    | TransactionEnvelopeEip7702.assert.ErrorType
    | fromNumber.ErrorType
    | Signature_toTuple.ErrorType
    | concat.ErrorType
    | Rlp_fromHex.ErrorType
    | Errors.GlobalErrorType
}

serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as serialize.ErrorType
