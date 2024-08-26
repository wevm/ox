import { AccessList_fromTupleList } from '../../accessList/fromTupleList.js'
import type { GlobalErrorType } from '../../errors/error.js'
import { Hex_isHex } from '../../hex/isHex.js'
import { Hex_slice } from '../../hex/slice.js'
import type { Hex } from '../../hex/types.js'
import { Rlp_toHex } from '../../rlp/to.js'
import { Signature_fromTuple } from '../../signature/fromTuple.js'
import type { Compute } from '../../types.js'
import { InvalidSerializedTransactionError } from '../errors.js'
import { TransactionEnvelopeEip2930_assert } from './assert.js'
import type {
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip2930_Serialized,
} from './types.js'

/**
 * Deserializes a {@link TransactionEnvelope#Eip2930} from its serialized form.
 *
 * @example
 * ```ts
 * import { TransactionEnvelopeEip2930 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip2930.deserializeEip2930('0x01ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
 * // {
 * //   type: 'eip2930',
 * //   chainId: 1,
 * //   nonce: 785n,
 * //   gasPrice: 2000000000n,
 * //   gas: 1000000n,
 * //   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 * //   value: 1000000000000000000n,
 * // }
 * ```
 */
export function TransactionEnvelopeEip2930_deserialize(
  serializedTransaction: TransactionEnvelopeEip2930_Serialized,
): TransactionEnvelopeEip2930_deserialize.ReturnType {
  const transactionArray = Rlp_toHex(Hex_slice(serializedTransaction, 1))

  const [
    chainId,
    nonce,
    gasPrice,
    gas,
    to,
    value,
    data,
    accessList,
    yParity,
    r,
    s,
  ] = transactionArray as readonly Hex[]

  if (!(transactionArray.length === 8 || transactionArray.length === 11))
    throw new InvalidSerializedTransactionError({
      attributes: {
        chainId,
        nonce,
        gasPrice,
        gas,
        to,
        value,
        data,
        accessList,
        ...(transactionArray.length > 8
          ? {
              yParity,
              r,
              s,
            }
          : {}),
      },
      serializedTransaction,
      type: 'eip2930',
    })

  let transaction = {
    chainId: Number(chainId as Hex),
    type: 'eip2930',
  } as TransactionEnvelopeEip2930
  if (Hex_isHex(to) && to !== '0x') transaction.to = to
  if (Hex_isHex(gas) && gas !== '0x') transaction.gas = BigInt(gas)
  if (Hex_isHex(data) && data !== '0x') transaction.data = data
  if (Hex_isHex(nonce) && nonce !== '0x') transaction.nonce = BigInt(nonce)
  if (Hex_isHex(value) && value !== '0x') transaction.value = BigInt(value)
  if (Hex_isHex(gasPrice) && gasPrice !== '0x')
    transaction.gasPrice = BigInt(gasPrice)
  if (accessList!.length !== 0 && accessList !== '0x')
    transaction.accessList = AccessList_fromTupleList(accessList as any)

  const signature =
    r && s && yParity ? Signature_fromTuple([yParity, r, s]) : undefined
  if (signature)
    transaction = {
      ...transaction,
      ...signature,
    } as TransactionEnvelopeEip2930

  TransactionEnvelopeEip2930_assert(transaction)

  return transaction
}

export declare namespace TransactionEnvelopeEip2930_deserialize {
  type ReturnType = Compute<TransactionEnvelopeEip2930>

  type ErrorType = GlobalErrorType
}

TransactionEnvelopeEip2930_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip2930_deserialize.ErrorType
