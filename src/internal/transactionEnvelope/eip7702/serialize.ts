import { AccessList_toTupleList } from '../../accessList/toTupleList.js'
import { Authorization_toTupleList } from '../../authorization/toTupleList.js'
import type { GlobalErrorType } from '../../errors/error.js'
import { Hex_concat } from '../../hex/concat.js'
import { Hex_from } from '../../hex/from.js'
import { Rlp_fromHex } from '../../rlp/from.js'
import { Signature_extract } from '../../signature/extract.js'
import { Signature_toTuple } from '../../signature/toTuple.js'
import type { Signature } from '../../signature/types.js'
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
 * // TODO
 */
export function TransactionEnvelopeEip7702_serialize(
  envelope: PartialBy<TransactionEnvelopeEip7702, 'type'>,
  options: TransactionEnvelopeEip7702_serialize.Options = {},
): TransactionEnvelopeEip7702_serialize.ReturnType {
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

  type ReturnType = TransactionEnvelopeEip7702_Serialized

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
