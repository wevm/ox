import { AccessList_fromTupleList } from '../../accessList/fromTupleList.js'
import { Authorization_fromTupleList } from '../../authorization/fromTupleList.js'
import type { GlobalErrorType } from '../../errors/error.js'
import { Hex_isHex } from '../../hex/isHex.js'
import { Hex_slice } from '../../hex/slice.js'
import type { Hex } from '../../hex/types.js'
import { Rlp_toHex } from '../../rlp/to.js'
import { Signature_fromTuple } from '../../signature/fromTuple.js'
import type { Compute } from '../../types.js'
import { InvalidSerializedTransactionError } from '../errors.js'
import { TransactionEnvelopeEip7702_assert } from './assert.js'
import type {
  TransactionEnvelopeEip7702,
  TransactionEnvelopeEip7702_Serialized,
} from './types.js'

/**
 * Deserializes a {@link TransactionEnvelope#Eip7702} from its serialized form.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeEip7702_deserialize(
  serializedTransaction: TransactionEnvelopeEip7702_Serialized,
): TransactionEnvelopeEip7702_deserialize.ReturnType {
  const transactionArray = Rlp_toHex(Hex_slice(serializedTransaction, 1))

  const [
    chainId,
    nonce,
    maxPriorityFeePerGas,
    maxFeePerGas,
    gas,
    to,
    value,
    data,
    accessList,
    authorizationList,
    yParity,
    r,
    s,
  ] = transactionArray as readonly Hex[]

  if (!(transactionArray.length === 10 || transactionArray.length === 13))
    throw new InvalidSerializedTransactionError({
      attributes: {
        chainId,
        nonce,
        maxPriorityFeePerGas,
        maxFeePerGas,
        gas,
        to,
        value,
        data,
        accessList,
        authorizationList,
        ...(transactionArray.length > 9
          ? {
              yParity,
              r,
              s,
            }
          : {}),
      },
      serializedTransaction,
      type: 'eip7702',
    })

  let transaction = {
    chainId: Number(chainId),
    type: 'eip7702',
  } as TransactionEnvelopeEip7702
  if (Hex_isHex(to) && to !== '0x') transaction.to = to
  if (Hex_isHex(gas) && gas !== '0x') transaction.gas = BigInt(gas)
  if (Hex_isHex(data) && data !== '0x') transaction.data = data
  if (Hex_isHex(nonce) && nonce !== '0x') transaction.nonce = BigInt(nonce)
  if (Hex_isHex(value) && value !== '0x') transaction.value = BigInt(value)
  if (Hex_isHex(maxFeePerGas) && maxFeePerGas !== '0x')
    transaction.maxFeePerGas = BigInt(maxFeePerGas)
  if (Hex_isHex(maxPriorityFeePerGas) && maxPriorityFeePerGas !== '0x')
    transaction.maxPriorityFeePerGas = BigInt(maxPriorityFeePerGas)
  if (accessList!.length !== 0 && accessList !== '0x')
    transaction.accessList = AccessList_fromTupleList(accessList as never)
  if (authorizationList !== '0x')
    transaction.authorizationList = Authorization_fromTupleList(
      authorizationList as never,
    )

  const signature =
    r && s && yParity ? Signature_fromTuple([yParity, r, s]) : undefined
  if (signature)
    transaction = {
      ...transaction,
      ...signature,
    } as TransactionEnvelopeEip7702

  TransactionEnvelopeEip7702_assert(transaction)

  return transaction
}

export declare namespace TransactionEnvelopeEip7702_deserialize {
  type ReturnType = Compute<TransactionEnvelopeEip7702>

  type ErrorType = GlobalErrorType
}

TransactionEnvelopeEip7702_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip7702_deserialize.ErrorType
