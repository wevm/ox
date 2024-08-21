import { deserializeAccessList } from '../accessList/deserializeAccessList.js'
import { isHex } from '../data/isHex.js'
import { slice } from '../data/slice.js'
import type { GlobalErrorType } from '../errors/error.js'
import { InvalidSignatureVError } from '../errors/signature.js'
import {
  InvalidSerializedTransactionError,
  TransactionTypeNotImplementedError,
} from '../errors/transactionEnvelope.js'
import { decodeRlp } from '../rlp/decodeRlp.js'
import type { RecursiveArray } from '../rlp/encodeRlp.js'
import { fromSignatureTuple } from '../signature/fromSignatureTuple.js'
import type { Hex } from '../types/data.js'
import type {
  TransactionEnvelope,
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip7702,
  TransactionEnvelopeLegacy,
  TransactionEnvelopeSerialized,
  TransactionEnvelopeSerializedEip1559,
  TransactionEnvelopeSerializedEip2930,
  TransactionEnvelopeSerializedLegacy,
  TransactionType,
} from '../types/transactionEnvelope.js'
import type { Compute, IsNarrowable } from '../types/utils.js'
import {
  assertTransactionEnvelopeEip1559,
  assertTransactionEnvelopeEip2930,
  assertTransactionEnvelopeLegacy,
} from './assertTransactionEnvelope.js'
import {
  type GetSerializedTransactionType,
  getSerializedTransactionType,
} from './getSerializedTransactionType.js'

/**
 * Deserializes a {@link TransactionEnvelope} from its serialized form.
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
export function deserializeTransactionEnvelope<
  const serialized extends TransactionEnvelopeSerialized,
>(
  serialized: serialized,
): deserializeTransactionEnvelope.ReturnType<serialized> {
  const type = getSerializedTransactionType(serialized)

  if (type === 'legacy')
    return deserializeTransactionEnvelopeLegacy(serialized as any) as never
  if (type === 'eip2930')
    return deserializeTransactionEnvelopeEip2930(serialized as any) as never
  if (type === 'eip1559')
    return deserializeTransactionEnvelopeEip1559(serialized as any) as never

  // TODO: 7702, 4844

  throw new TransactionTypeNotImplementedError({ type })
}

export declare namespace deserializeTransactionEnvelope {
  type ReturnType<
    serialized extends
      TransactionEnvelopeSerialized = TransactionEnvelopeSerialized,
    type extends TransactionType = GetSerializedTransactionType<serialized>,
  > = Compute<
    IsNarrowable<serialized, Hex> extends true
      ?
          | (type extends 'eip1559' ? TransactionEnvelopeEip1559 : never)
          | (type extends 'eip2930' ? TransactionEnvelopeEip2930 : never)
          | (type extends 'eip4844' ? TransactionEnvelopeEip4844 : never)
          | (type extends 'eip7702' ? TransactionEnvelopeEip7702 : never)
          | (type extends 'legacy' ? TransactionEnvelopeLegacy : never)
      : TransactionEnvelope
  >

  type ErrorType = GlobalErrorType
}

/**
 * Deserializes a legacy {@link TransactionEnvelope} from its serialized form.
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
export function deserializeTransactionEnvelopeLegacy(
  serializedTransaction: TransactionEnvelopeSerializedLegacy,
): deserializeTransactionEnvelopeLegacy.ReturnType {
  const tuple = decodeRlp(serializedTransaction, 'hex')

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
  } as TransactionEnvelopeLegacy
  if (isHex(to) && to !== '0x') transaction.to = to
  if (isHex(gas) && gas !== '0x') transaction.gas = BigInt(gas)
  if (isHex(data) && data !== '0x') transaction.data = data
  if (isHex(nonce) && nonce !== '0x') transaction.nonce = BigInt(nonce)
  if (isHex(value) && value !== '0x') transaction.value = BigInt(value)
  if (isHex(gasPrice) && gasPrice !== '0x')
    transaction.gasPrice = BigInt(gasPrice)

  if (tuple.length === 6) return transaction

  const chainIdOrV =
    isHex(chainIdOrV_) && chainIdOrV_ !== '0x' ? Number(chainIdOrV_ as Hex) : 0

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

  assertTransactionEnvelopeLegacy(transaction)

  return transaction
}

export declare namespace deserializeTransactionEnvelopeLegacy {
  type ReturnType = Compute<TransactionEnvelopeLegacy>

  type ErrorType = GlobalErrorType
}

/**
 * Deserializes a EIP-2930 {@link TransactionEnvelope} from its serialized form.
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
export function deserializeTransactionEnvelopeEip2930(
  serializedTransaction: TransactionEnvelopeSerializedEip2930,
): deserializeTransactionEnvelopeEip2930.ReturnType {
  const transactionArray = decodeRlp(slice(serializedTransaction, 1))

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
  if (isHex(to) && to !== '0x') transaction.to = to
  if (isHex(gas) && gas !== '0x') transaction.gas = BigInt(gas)
  if (isHex(data) && data !== '0x') transaction.data = data
  if (isHex(nonce) && nonce !== '0x') transaction.nonce = BigInt(nonce)
  if (isHex(value) && value !== '0x') transaction.value = BigInt(value)
  if (isHex(gasPrice) && gasPrice !== '0x')
    transaction.gasPrice = BigInt(gasPrice)
  if (accessList!.length !== 0 && accessList !== '0x')
    transaction.accessList = deserializeAccessList(
      accessList as RecursiveArray<Hex>,
    )

  const signature = (() => {
    if (r && s && yParity) return fromSignatureTuple([yParity, r, s])
    return undefined
  })()
  if (signature)
    transaction = { ...transaction, ...signature } as TransactionEnvelopeEip2930

  assertTransactionEnvelopeEip2930(transaction)

  return transaction
}

export declare namespace deserializeTransactionEnvelopeEip2930 {
  type ReturnType = Compute<TransactionEnvelopeEip2930>

  type ErrorType = GlobalErrorType
}

/**
 * Deserializes a EIP-1559 {@link TransactionEnvelope} from its serialized form.
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
export function deserializeTransactionEnvelopeEip1559(
  serializedTransaction: TransactionEnvelopeSerializedEip1559,
): deserializeTransactionEnvelopeEip1559.ReturnType {
  const transactionArray = decodeRlp(slice(serializedTransaction, 1))

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
      type: 'eip2930',
    })

  let transaction = {
    chainId: Number(chainId),
    type: 'eip1559',
  } as TransactionEnvelopeEip1559
  if (isHex(to) && to !== '0x') transaction.to = to
  if (isHex(gas) && gas !== '0x') transaction.gas = BigInt(gas)
  if (isHex(data) && data !== '0x') transaction.data = data
  if (isHex(nonce) && nonce !== '0x') transaction.nonce = BigInt(nonce)
  if (isHex(value) && value !== '0x') transaction.value = BigInt(value)
  if (isHex(maxFeePerGas) && maxFeePerGas !== '0x')
    transaction.maxFeePerGas = BigInt(maxFeePerGas)
  if (isHex(maxPriorityFeePerGas) && maxPriorityFeePerGas !== '0x')
    transaction.maxPriorityFeePerGas = BigInt(maxPriorityFeePerGas)
  if (accessList!.length !== 0 && accessList !== '0x')
    transaction.accessList = deserializeAccessList(
      accessList as RecursiveArray<Hex>,
    )

  const signature = (() => {
    if (r && s && yParity) return fromSignatureTuple([yParity, r, s])
    return undefined
  })()
  if (signature)
    transaction = { ...transaction, ...signature } as TransactionEnvelopeEip1559

  assertTransactionEnvelopeEip1559(transaction)

  return transaction
}

export declare namespace deserializeTransactionEnvelopeEip1559 {
  type ReturnType = Compute<TransactionEnvelopeEip1559>

  type ErrorType = GlobalErrorType
}
