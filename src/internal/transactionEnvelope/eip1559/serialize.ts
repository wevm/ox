import { AccessList_toTupleList } from '../../accessList/toTupleList.js'
import type { GlobalErrorType } from '../../errors/error.js'
import { Hex_concat } from '../../hex/concat.js'
import { Hex_from } from '../../hex/from.js'
import { Rlp_fromHex } from '../../rlp/from.js'
import { Signature_extract } from '../../signature/extract.js'
import { Signature_toTuple } from '../../signature/toTuple.js'
import type { Signature } from '../../signature/types.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeEip1559_assert } from './assert.js'
import { TransactionEnvelopeEip1559_serializedType } from './constants.js'
import type {
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip1559_Serialized,
} from './types.js'

/**
 * Serializes a {@link TransactionEnvelope#Eip1559}.
 *
 * @example
 * ```ts
 * import { TransactionEnvelopeEip1559 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip1559.from({
 *   maxFeePerGas: 1000000n,
 *   to: '0x0000000000000000000000000000000000000000',
 * })
 *
 * const serialized = TransactionEnvelopeEip1559.serialize(envelope)
 * // '0x02...'
 * ```
 */
export function TransactionEnvelopeEip1559_serialize(
  envelope: PartialBy<TransactionEnvelopeEip1559, 'type'>,
  options: TransactionEnvelopeEip1559_serialize.Options = {},
): TransactionEnvelopeEip1559_serialize.ReturnType {
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

  TransactionEnvelopeEip1559_assert(envelope)

  const accessTupleList = AccessList_toTupleList(accessList)

  const signature = Signature_extract(options.signature || (envelope as any))

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
    ...(signature ? Signature_toTuple(signature) : []),
  ]

  return Hex_concat(
    TransactionEnvelopeEip1559_serializedType,
    Rlp_fromHex(serializedTransaction),
  ) as TransactionEnvelopeEip1559_Serialized
}

export declare namespace TransactionEnvelopeEip1559_serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ReturnType = TransactionEnvelopeEip1559_Serialized

  type ErrorType =
    | TransactionEnvelopeEip1559_assert.ErrorType
    | Hex_from.ErrorType
    | Signature_toTuple.ErrorType
    | Hex_concat.ErrorType
    | Rlp_fromHex.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip1559_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip1559_serialize.ErrorType
