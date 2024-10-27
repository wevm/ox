import type * as Errors from '../../../Errors.js'
import { AccessList_fromTupleList } from '../../AccessList/fromTupleList.js'
import { Authorization_fromTupleList } from '../../Authorization/fromTupleList.js'
import { Hex_slice } from '../../Hex/slice.js'
import type { Hex } from '../../Hex/types.js'
import { Hex_validate } from '../../Hex/validate.js'
import { Rlp_toHex } from '../../Rlp/to.js'
import { Signature_fromTuple } from '../../Signature/fromTuple.js'
import type { Compute } from '../../types.js'
import { TransactionEnvelope_InvalidSerializedError } from '../errors.js'
import { TransactionEnvelopeEip7702_assert } from './assert.js'
import type {
  TransactionEnvelopeEip7702,
  TransactionEnvelopeEip7702_Serialized,
} from './types.js'

/**
 * Deserializes a {@link ox#TransactionEnvelope.Eip7702} from its serialized form.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip7702 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip7702.deserialize('0x04ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
 * // @log: {
 * // @log:   authorizationList: [...],
 * // @log:   type: 'eip7702',
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
export function TransactionEnvelopeEip7702_deserialize(
  serializedTransaction: TransactionEnvelopeEip7702_Serialized,
): Compute<TransactionEnvelopeEip7702> {
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
    throw new TransactionEnvelope_InvalidSerializedError({
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
  if (Hex_validate(to) && to !== '0x') transaction.to = to
  if (Hex_validate(gas) && gas !== '0x') transaction.gas = BigInt(gas)
  if (Hex_validate(data) && data !== '0x') transaction.data = data
  if (Hex_validate(nonce) && nonce !== '0x') transaction.nonce = BigInt(nonce)
  if (Hex_validate(value) && value !== '0x') transaction.value = BigInt(value)
  if (Hex_validate(maxFeePerGas) && maxFeePerGas !== '0x')
    transaction.maxFeePerGas = BigInt(maxFeePerGas)
  if (Hex_validate(maxPriorityFeePerGas) && maxPriorityFeePerGas !== '0x')
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
  type ErrorType = Errors.GlobalErrorType
}

TransactionEnvelopeEip7702_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip7702_deserialize.ErrorType
