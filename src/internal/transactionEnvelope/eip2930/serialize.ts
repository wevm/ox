import { AccessList_toTupleList } from '../../accessList/toTupleList.js'
import type { GlobalErrorType } from '../../errors/error.js'
import { Hex_concat } from '../../hex/concat.js'
import { Hex_from } from '../../hex/from.js'
import { Rlp_fromHex } from '../../rlp/from.js'
import { Signature_extract } from '../../signature/extract.js'
import { Signature_toTuple } from '../../signature/toTuple.js'
import type { Signature } from '../../signature/types.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip2930_assert } from './assert.js'
import type {
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip2930_Serialized,
} from './types.js'

/**
 * Serializes a {@link TransactionEnvelope#Eip2930}.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.fromEip2930({
 *   accessList: [...],
 *   gasPrice: 1000000n,
 *   to: '0x0000000000000000000000000000000000000000',
 * })
 *
 * const serialized = TransactionEnvelope.serializeEip2930(envelope)
 * // '0x01...'
 * ```
 */
export function TransactionEnvelopeEip2930_serialize(
  envelope: PartialBy<TransactionEnvelopeEip2930, 'type'>,
  options: TransactionEnvelopeEip2930_serialize.Options = {},
): TransactionEnvelopeEip2930_serialize.ReturnType {
  const { chainId, gas, data, input, nonce, to, value, accessList, gasPrice } =
    envelope

  TransactionEnvelopeEip2930_assert(envelope)

  const accessTupleList = AccessList_toTupleList(accessList)

  const signature = Signature_extract(options.signature || (envelope as any))

  const serializedTransaction = [
    Hex_from(chainId),
    nonce ? Hex_from(nonce) : '0x',
    gasPrice ? Hex_from(gasPrice) : '0x',
    gas ? Hex_from(gas) : '0x',
    to ?? '0x',
    value ? Hex_from(value) : '0x',
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

  type ReturnType = TransactionEnvelopeEip2930_Serialized

  type ErrorType =
    | TransactionEnvelopeEip2930_assert.ErrorType
    | Hex_from.ErrorType
    | Signature_toTuple.ErrorType
    | Hex_concat.ErrorType
    | Rlp_fromHex.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip2930_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip2930_serialize.ErrorType
