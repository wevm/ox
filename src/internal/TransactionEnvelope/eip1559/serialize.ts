import type * as Errors from '../../../Errors.js'
import * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import { AccessList_toTupleList } from '../../AccessList/toTupleList.js'
import { Hex_concat } from '../../Hex/concat.js'
import { Hex_fromNumber } from '../../Hex/fromNumber.js'
import { Rlp_fromHex } from '../../Rlp/from.js'
import { Signature_extract } from '../../Signature/extract.js'
import { Signature_toTuple } from '../../Signature/toTuple.js'
import type { Signature } from '../../Signature/types.js'
import type { PartialBy } from '../../types.js'

/**
 * Serializes a {@link ox#TransactionEnvelope.Eip1559}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip1559, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip1559.from({
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const serialized = TransactionEnvelopeEip1559.serialize(envelope) // [!code focus]
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the serialized Transaction Envelope.
 *
 * ```ts twoslash
 * import { Secp256k1, TransactionEnvelopeEip1559, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip1559.from({
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelopeEip1559.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const serialized = TransactionEnvelopeEip1559.serialize(envelope, { // [!code focus]
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
  envelope: PartialBy<TransactionEnvelopeEip1559.TransactionEnvelope, 'type'>,
  options: TransactionEnvelopeEip1559.serialize.Options = {},
): TransactionEnvelopeEip1559.Serialized {
  const {
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

  TransactionEnvelopeEip1559.assert(envelope)

  const accessTupleList = AccessList_toTupleList(accessList)

  const signature = Signature_extract(options.signature || (envelope as any))

  const serializedTransaction = [
    Hex_fromNumber(chainId),
    nonce ? Hex_fromNumber(nonce) : '0x',
    maxPriorityFeePerGas ? Hex_fromNumber(maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? Hex_fromNumber(maxFeePerGas) : '0x',
    gas ? Hex_fromNumber(gas) : '0x',
    to ?? '0x',
    value ? Hex_fromNumber(value) : '0x',
    data ?? input ?? '0x',
    accessTupleList,
    ...(signature ? Signature_toTuple(signature) : []),
  ]

  return Hex_concat(
    TransactionEnvelopeEip1559.serializedType,
    Rlp_fromHex(serializedTransaction),
  ) as TransactionEnvelopeEip1559.Serialized
}

export declare namespace serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ErrorType =
    | TransactionEnvelopeEip1559.assert.ErrorType
    | Hex_fromNumber.ErrorType
    | Signature_toTuple.ErrorType
    | Hex_concat.ErrorType
    | Rlp_fromHex.ErrorType
    | Errors.GlobalErrorType
}

serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as serialize.ErrorType
