import { AccessList_fromTupleList } from '../../accessList/fromTupleList.js'
import { Blobs_toSidecars } from '../../blobs/toSidecars.js'
import type { GlobalErrorType } from '../../errors/error.js'
import { Hex_isHex } from '../../hex/isHex.js'
import { Hex_slice } from '../../hex/slice.js'
import type { Hex } from '../../hex/types.js'
import { Rlp_toHex } from '../../rlp/to.js'
import { Signature_fromTuple } from '../../signature/fromTuple.js'
import type { Compute } from '../../types.js'
import { InvalidSerializedTransactionError } from '../errors.js'
import { TransactionEnvelopeEip4844_assert } from './assert.js'
import type {
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip4844_Serialized,
} from './types.js'

/**
 * Deserializes a {@link TransactionEnvelope#Eip4844} from its serialized form.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeEip4844_deserialize(
  serializedTransaction: TransactionEnvelopeEip4844_Serialized,
): TransactionEnvelopeEip4844_deserialize.ReturnType {
  const transactionOrWrapperArray = Rlp_toHex(
    Hex_slice(serializedTransaction, 1),
  )

  const hasNetworkWrapper = transactionOrWrapperArray.length === 4

  const transactionArray = hasNetworkWrapper
    ? transactionOrWrapperArray[0]!
    : transactionOrWrapperArray
  const wrapperArray = hasNetworkWrapper
    ? transactionOrWrapperArray.slice(1)
    : []

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
    maxFeePerBlobGas,
    blobVersionedHashes,
    yParity,
    r,
    s,
  ] = transactionArray
  const [blobs, commitments, proofs] = wrapperArray

  if (!(transactionArray.length === 11 || transactionArray.length === 14))
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
      type: 'eip4844',
    })

  let transaction = {
    blobVersionedHashes: blobVersionedHashes as Hex[],
    chainId: Number(chainId),
    type: 'eip4844',
  } as TransactionEnvelopeEip4844
  if (Hex_isHex(to) && to !== '0x') transaction.to = to
  if (Hex_isHex(gas) && gas !== '0x') transaction.gas = BigInt(gas)
  if (Hex_isHex(data) && data !== '0x') transaction.data = data
  if (Hex_isHex(nonce) && nonce !== '0x') transaction.nonce = BigInt(nonce)
  if (Hex_isHex(value) && value !== '0x') transaction.value = BigInt(value)
  if (Hex_isHex(maxFeePerBlobGas) && maxFeePerBlobGas !== '0x')
    transaction.maxFeePerBlobGas = BigInt(maxFeePerBlobGas)
  if (Hex_isHex(maxFeePerGas) && maxFeePerGas !== '0x')
    transaction.maxFeePerGas = BigInt(maxFeePerGas)
  if (Hex_isHex(maxPriorityFeePerGas) && maxPriorityFeePerGas !== '0x')
    transaction.maxPriorityFeePerGas = BigInt(maxPriorityFeePerGas)
  if (accessList?.length !== 0 && accessList !== '0x')
    transaction.accessList = AccessList_fromTupleList(accessList as any)
  if (blobs && commitments && proofs)
    transaction.sidecars = Blobs_toSidecars(blobs as Hex[], {
      commitments: commitments as Hex[],
      proofs: proofs as Hex[],
    })

  const signature =
    r && s && yParity
      ? Signature_fromTuple([yParity as Hex, r as Hex, s as Hex])
      : undefined
  if (signature)
    transaction = {
      ...transaction,
      ...signature,
    } as TransactionEnvelopeEip4844

  TransactionEnvelopeEip4844_assert(transaction)

  return transaction
}

export declare namespace TransactionEnvelopeEip4844_deserialize {
  type ReturnType = Compute<TransactionEnvelopeEip4844>

  type ErrorType = GlobalErrorType
}

TransactionEnvelopeEip4844_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip4844_deserialize.ErrorType
