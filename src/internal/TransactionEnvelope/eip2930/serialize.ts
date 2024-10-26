import type * as Errors from '../../../Errors.js'
import * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import * as AccessList from '../../AccessList/toTupleList.js'
import { concat } from '../../Hex/concat.js'
import { fromNumber } from '../../Hex/fromNumber.js'
import { Rlp_fromHex } from '../../Rlp/from.js'
import { Signature_extract } from '../../Signature/extract.js'
import { Signature_toTuple } from '../../Signature/toTuple.js'
import type { Signature } from '../../Signature/types.js'
import type { PartialBy } from '../../types.js'

/**
 * Serializes a {@link ox#TransactionEnvelope.Eip2930}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip2930, Value } from 'ox'
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
export function serialize(
  envelope: PartialBy<TransactionEnvelopeEip2930.TransactionEnvelope, 'type'>,
  options: serialize.Options = {},
): TransactionEnvelopeEip2930.Serialized {
  const { chainId, gas, data, input, nonce, to, value, accessList, gasPrice } =
    envelope

  TransactionEnvelopeEip2930.assert(envelope)

  const accessTupleList = AccessList.toTupleList(accessList)

  const signature = Signature_extract(options.signature || (envelope as any))

  const serializedTransaction = [
    fromNumber(chainId),
    nonce ? fromNumber(nonce) : '0x',
    gasPrice ? fromNumber(gasPrice) : '0x',
    gas ? fromNumber(gas) : '0x',
    to ?? '0x',
    value ? fromNumber(value) : '0x',
    data ?? input ?? '0x',
    accessTupleList,
    ...(signature ? Signature_toTuple(signature) : []),
  ] as const

  return concat(
    '0x01',
    Rlp_fromHex(serializedTransaction),
  ) as TransactionEnvelopeEip2930.Serialized
}

export declare namespace serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ErrorType =
    | AccessList.toTupleList.ErrorType
    | TransactionEnvelopeEip2930.assert.ErrorType
    | fromNumber.ErrorType
    | Signature_toTuple.ErrorType
    | concat.ErrorType
    | Rlp_fromHex.ErrorType
    | Errors.GlobalErrorType
}

serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as serialize.ErrorType
