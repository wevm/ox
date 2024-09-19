import { AccessList_toTupleList } from '../../AccessList/toTupleList.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import { Hex_concat } from '../../Hex/concat.js'
import { Hex_fromNumber } from '../../Hex/fromNumber.js'
import { Rlp_fromHex } from '../../Rlp/from.js'
import { Signature_extract } from '../../Signature/extract.js'
import { Signature_toTuple } from '../../Signature/toTuple.js'
import type { Signature } from '../../Signature/types.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip2930_assert } from './assert.js'
import type {
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip2930_Serialized,
} from './types.js'

/**
 * Serializes a {@link ox#TransactionEnvelope.Eip2930}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip2930 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip2930.from({
 *   chainId: 1,
 *   gasPrice: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const serialized = TransactionEnvelopeEip2930.serialize(envelope) // [!code focus]
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the serialized Transaction Envelope.
 *
 * ```ts twoslash
 * import { Secp256k1, TransactionEnvelopeEip2930, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip2930.from({
 *   chainId: 1,
 *   gasPrice: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelopeEip2930.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const serialized = TransactionEnvelopeEip2930.serialize(envelope, { // [!code focus]
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
export function TransactionEnvelopeEip2930_serialize(
  envelope: PartialBy<TransactionEnvelopeEip2930, 'type'>,
  options: TransactionEnvelopeEip2930_serialize.Options = {},
): TransactionEnvelopeEip2930_Serialized {
  const { chainId, gas, data, input, nonce, to, value, accessList, gasPrice } =
    envelope

  TransactionEnvelopeEip2930_assert(envelope)

  const accessTupleList = AccessList_toTupleList(accessList)

  const signature = Signature_extract(options.signature || (envelope as any))

  const serializedTransaction = [
    Hex_fromNumber(chainId),
    nonce ? Hex_fromNumber(nonce) : '0x',
    gasPrice ? Hex_fromNumber(gasPrice) : '0x',
    gas ? Hex_fromNumber(gas) : '0x',
    to ?? '0x',
    value ? Hex_fromNumber(value) : '0x',
    data ?? input ?? '0x',
    accessTupleList,
    ...(signature ? Signature_toTuple(signature) : []),
  ] as const

  return Hex_concat(
    '0x01',
    Rlp_fromHex(serializedTransaction),
  ) as TransactionEnvelopeEip2930_Serialized
}

export declare namespace TransactionEnvelopeEip2930_serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ErrorType =
    | TransactionEnvelopeEip2930_assert.ErrorType
    | Hex_fromNumber.ErrorType
    | Signature_toTuple.ErrorType
    | Hex_concat.ErrorType
    | Rlp_fromHex.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip2930_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip2930_serialize.ErrorType
