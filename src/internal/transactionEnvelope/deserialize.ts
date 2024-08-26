import { AccessList_fromTupleList } from '../accessList/fromTupleList.js'
import { Blobs_toSidecars } from '../blobs/toSidecars.js'
import type { GlobalErrorType } from '../errors/error.js'
import { InvalidSignatureVError } from '../errors/signature.js'
import {
  InvalidSerializedTransactionError,
  TransactionTypeNotImplementedError,
} from '../errors/transactionEnvelope.js'
import { Hex_isHex } from '../hex/isHex.js'
import { Hex_slice } from '../hex/slice.js'
import type { Hex } from '../hex/types.js'
import { Rlp_toHex } from '../rlp/to.js'
import { Signature_fromTuple } from '../signature/fromTuple.js'
import type { Compute, IsNarrowable } from '../types.js'
import {
  TransactionEnvelope_assertEip1559,
  TransactionEnvelope_assertEip2930,
  TransactionEnvelope_assertEip4844,
  TransactionEnvelope_assertLegacy,
} from './assert.js'
import {
  type GetSerializedType,
  TransactionEnvelope_getSerializedType,
} from './getSerializedType.js'
import type {
  TransactionEnvelope,
  TransactionEnvelope_Eip1559,
  TransactionEnvelope_Eip2930,
  TransactionEnvelope_Eip4844,
  TransactionEnvelope_Eip7702,
  TransactionEnvelope_Legacy,
  TransactionEnvelope_Serialized,
  TransactionEnvelope_SerializedEip1559,
  TransactionEnvelope_SerializedEip2930,
  TransactionEnvelope_SerializedEip4844,
  TransactionEnvelope_SerializedLegacy,
  TransactionEnvelope_Type,
} from './types.js'

/**
 * Deserializes a {@link TransactionEnvelope#TransactionEnvelope} from its serialized form.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.deserialize('0x02ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
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
export function TransactionEnvelope_deserialize<
  const serialized extends TransactionEnvelope_Serialized,
>(
  serialized: serialized,
): TransactionEnvelope_deserialize.ReturnType<serialized> {
  const type = TransactionEnvelope_getSerializedType(serialized)

  if (type === 'legacy')
    return TransactionEnvelope_deserializeLegacy(serialized as any) as never
  if (type === 'eip2930')
    return TransactionEnvelope_deserializeEip2930(serialized as any) as never
  if (type === 'eip1559')
    return TransactionEnvelope_deserializeEip1559(serialized as any) as never
  if (type === 'eip4844')
    return TransactionEnvelope_deserializeEip4844(serialized as any) as never

  // TODO: 7702

  throw new TransactionTypeNotImplementedError({ type })
}

export declare namespace TransactionEnvelope_deserialize {
  type ReturnType<
    serialized extends
      TransactionEnvelope_Serialized = TransactionEnvelope_Serialized,
    type extends TransactionEnvelope_Type = GetSerializedType<serialized>,
  > = Compute<
    IsNarrowable<serialized, Hex> extends true
      ?
          | (type extends 'eip1559' ? TransactionEnvelope_Eip1559 : never)
          | (type extends 'eip2930' ? TransactionEnvelope_Eip2930 : never)
          | (type extends 'eip4844' ? TransactionEnvelope_Eip4844 : never)
          | (type extends 'eip7702' ? TransactionEnvelope_Eip7702 : never)
          | (type extends 'legacy' ? TransactionEnvelope_Legacy : never)
      : TransactionEnvelope
  >

  type ErrorType =
    | TransactionEnvelope_getSerializedType.ErrorType
    | TransactionEnvelope_deserializeLegacy.ErrorType
    | TransactionEnvelope_deserializeEip2930.ErrorType
    | TransactionEnvelope_deserializeEip1559.ErrorType
    | GlobalErrorType
}

TransactionEnvelope_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_deserialize.ErrorType

/**
 * Deserializes a {@link TransactionEnvelope#Legacy} from its serialized form.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.deserializeLegacy('0x01ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
 * // {
 * //   type: 'legacy',
 * //   nonce: 785n,
 * //   gasPrice: 2000000000n,
 * //   gas: 1000000n,
 * //   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 * //   value: 1000000000000000000n,
 * // }
 * ```
 */
export function TransactionEnvelope_deserializeLegacy(
  serializedTransaction: TransactionEnvelope_SerializedLegacy,
): TransactionEnvelope_deserializeLegacy.ReturnType {
  const tuple = Rlp_toHex(serializedTransaction)

  const [nonce, gasPrice, gas, to, value, data, chainIdOrV_, r, s] =
    tuple as readonly Hex[]

  if (!(tuple.length === 6 || tuple.length === 9))
    throw new InvalidSerializedTransactionError({
      attributes: {
        nonce,
        gasPrice,
        gas,
        to,
        value,
        data,
        ...(tuple.length > 6
          ? {
              v: chainIdOrV_,
              r,
              s,
            }
          : {}),
      },
      serializedTransaction,
      type: 'legacy',
    })

  const transaction = {
    type: 'legacy',
  } as TransactionEnvelope_Legacy
  if (Hex_isHex(to) && to !== '0x') transaction.to = to
  if (Hex_isHex(gas) && gas !== '0x') transaction.gas = BigInt(gas)
  if (Hex_isHex(data) && data !== '0x') transaction.data = data
  if (Hex_isHex(nonce) && nonce !== '0x') transaction.nonce = BigInt(nonce)
  if (Hex_isHex(value) && value !== '0x') transaction.value = BigInt(value)
  if (Hex_isHex(gasPrice) && gasPrice !== '0x')
    transaction.gasPrice = BigInt(gasPrice)

  if (tuple.length === 6) return transaction

  const chainIdOrV =
    Hex_isHex(chainIdOrV_) && chainIdOrV_ !== '0x'
      ? Number(chainIdOrV_ as Hex)
      : 0

  if (s === '0x' && r === '0x') {
    if (chainIdOrV > 0) transaction.chainId = Number(chainIdOrV)
    return transaction
  }

  const v = chainIdOrV
  const chainId: number | undefined = Math.floor((v - 35) / 2)
  if (chainId > 0) transaction.chainId = chainId
  else if (v !== 27 && v !== 28) throw new InvalidSignatureVError({ value: v })

  transaction.v = v
  transaction.s = BigInt(s!)
  transaction.r = BigInt(r!)

  TransactionEnvelope_assertLegacy(transaction)

  return transaction
}

export declare namespace TransactionEnvelope_deserializeLegacy {
  type ReturnType = Compute<TransactionEnvelope_Legacy>

  type ErrorType = GlobalErrorType
}

TransactionEnvelope_deserializeLegacy.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_deserializeLegacy.ErrorType

/**
 * Deserializes a {@link TransactionEnvelope#Eip2930} from its serialized form.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.deserializeEip2930('0x01ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
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
export function TransactionEnvelope_deserializeEip2930(
  serializedTransaction: TransactionEnvelope_SerializedEip2930,
): TransactionEnvelope_deserializeEip2930.ReturnType {
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
  } as TransactionEnvelope_Eip2930
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
    } as TransactionEnvelope_Eip2930

  TransactionEnvelope_assertEip2930(transaction)

  return transaction
}

export declare namespace TransactionEnvelope_deserializeEip2930 {
  type ReturnType = Compute<TransactionEnvelope_Eip2930>

  type ErrorType = GlobalErrorType
}

TransactionEnvelope_deserializeEip2930.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_deserializeEip2930.ErrorType

/**
 * Deserializes a {@link TransactionEnvelope#Eip1559} from its serialized form.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.deserializeEip1559('0x02ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
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
export function TransactionEnvelope_deserializeEip1559(
  serializedTransaction: TransactionEnvelope_SerializedEip1559,
): TransactionEnvelope_deserializeEip1559.ReturnType {
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
  } as TransactionEnvelope_Eip1559
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
    } as TransactionEnvelope_Eip1559

  TransactionEnvelope_assertEip1559(transaction)

  return transaction
}

export declare namespace TransactionEnvelope_deserializeEip1559 {
  type ReturnType = Compute<TransactionEnvelope_Eip1559>

  type ErrorType = GlobalErrorType
}

TransactionEnvelope_deserializeEip1559.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_deserializeEip1559.ErrorType

/**
 * Deserializes a {@link TransactionEnvelope#Eip4844} from its serialized form.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelope_deserializeEip4844(
  serializedTransaction: TransactionEnvelope_SerializedEip4844,
): TransactionEnvelope_deserializeEip4844.ReturnType {
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
  } as TransactionEnvelope_Eip4844
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
    } as TransactionEnvelope_Eip4844

  TransactionEnvelope_assertEip4844(transaction)

  return transaction
}

export declare namespace TransactionEnvelope_deserializeEip4844 {
  type ReturnType = Compute<TransactionEnvelope_Eip4844>

  type ErrorType = GlobalErrorType
}

TransactionEnvelope_deserializeEip4844.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_deserializeEip4844.ErrorType
