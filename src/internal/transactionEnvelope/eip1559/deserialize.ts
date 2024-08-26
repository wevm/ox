import { AccessList_fromTupleList } from '../../accessList/fromTupleList.js'
import type { GlobalErrorType } from '../../errors/error.js'
import { Hex_isHex } from '../../hex/isHex.js'
import { Hex_slice } from '../../hex/slice.js'
import type { Hex } from '../../hex/types.js'
import { Rlp_toHex } from '../../rlp/to.js'
import { Signature_fromTuple } from '../../signature/fromTuple.js'
import type { Compute } from '../../types.js'
import { InvalidSerializedTransactionError } from '../errors.js'
import { TransactionEnvelopeEip1559_assert } from './assert.js'
import type {
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip1559_Serialized,
} from './types.js'

/**
 * Deserializes a {@link TransactionEnvelope#Eip1559} from its serialized form.
 *
 * @example
 * ```ts
 * import { TransactionEnvelopeEip1559 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip1559.deserialize('0x02ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
 * // {
 * //   type: 'eip1559',
 * //   chainId: 1,
 * //   nonce: 785n,
 * //   maxFeePerGas: 2000000000n,
 * //   maxPriorityFeePerGas: 2000000000n,
 * //   gas: 1000000n,
 * //   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 * //   value: 1000000000000000000n,
 * // }
 * ```
 */
export function TransactionEnvelopeEip1559_deserialize(
  serializedTransaction: TransactionEnvelopeEip1559_Serialized,
): TransactionEnvelopeEip1559_deserialize.ReturnType {
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
    yParity,
    r,
    s,
  ] = transactionArray as readonly Hex[]

  if (!(transactionArray.length === 9 || transactionArray.length === 12))
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
        ...(transactionArray.length > 9
          ? {
              yParity,
              r,
              s,
            }
          : {}),
      },
      serializedTransaction,
      type: 'eip1559',
    })

  let transaction = {
    chainId: Number(chainId),
    type: 'eip1559',
  } as TransactionEnvelopeEip1559
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
    transaction.accessList = AccessList_fromTupleList(accessList as any)

  const signature =
    r && s && yParity ? Signature_fromTuple([yParity, r, s]) : undefined
  if (signature)
    transaction = {
      ...transaction,
      ...signature,
    } as TransactionEnvelopeEip1559

  TransactionEnvelopeEip1559_assert(transaction)

  return transaction
}

export declare namespace TransactionEnvelopeEip1559_deserialize {
  type ReturnType = Compute<TransactionEnvelopeEip1559>

  type ErrorType = GlobalErrorType
}

TransactionEnvelopeEip1559_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip1559_deserialize.ErrorType
