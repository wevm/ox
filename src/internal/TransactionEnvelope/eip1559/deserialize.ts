import type { Errors } from '../../../Errors.js'
import { Hex } from '../../../Hex.js'
import { TransactionEnvelope } from '../../../TransactionEnvelope.js'
import { AccessList_fromTupleList } from '../../AccessList/fromTupleList.js'
import { Rlp_toHex } from '../../Rlp/to.js'
import { Signature_fromTuple } from '../../Signature/fromTuple.js'
import type { Compute } from '../../types.js'
import { TransactionEnvelopeEip1559_assert } from './assert.js'
import type {
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip1559_Serialized,
} from './types.js'

/**
 * Deserializes a {@link ox#TransactionEnvelopeEip1559.TransactionEnvelope} from its serialized form.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip1559 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip1559.deserialize('0x02ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
 * // @log: {
 * // @log:   type: 'eip1559',
 * // @log:   nonce: 785n,
 * // @log:   maxFeePerGas: 2000000000n,
 * // @log:   gas: 1000000n,
 * // @log:   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 * // @log:   value: 1000000000000000000n,
 * // @log: }
 * ```
 *
 * @param serializedTransaction - The serialized transaction.
 * @returns Deserialized Transaction Envelope.
 */
export function TransactionEnvelopeEip1559_deserialize(
  serializedTransaction: TransactionEnvelopeEip1559_Serialized,
): Compute<TransactionEnvelopeEip1559> {
  const transactionArray = Rlp_toHex(Hex.slice(serializedTransaction, 1))

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
    throw new TransactionEnvelope.InvalidSerializedError({
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
  if (Hex.validate(to) && to !== '0x') transaction.to = to
  if (Hex.validate(gas) && gas !== '0x') transaction.gas = BigInt(gas)
  if (Hex.validate(data) && data !== '0x') transaction.data = data
  if (Hex.validate(nonce) && nonce !== '0x') transaction.nonce = BigInt(nonce)
  if (Hex.validate(value) && value !== '0x') transaction.value = BigInt(value)
  if (Hex.validate(maxFeePerGas) && maxFeePerGas !== '0x')
    transaction.maxFeePerGas = BigInt(maxFeePerGas)
  if (Hex.validate(maxPriorityFeePerGas) && maxPriorityFeePerGas !== '0x')
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
  type ErrorType = Errors.GlobalErrorType
}

TransactionEnvelopeEip1559_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip1559_deserialize.ErrorType
