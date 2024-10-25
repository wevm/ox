import type * as Errors from '../../../Errors.js'
import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import { AccessList_fromTupleList } from '../../AccessList/fromTupleList.js'
import { Hex_slice } from '../../Hex/slice.js'
import type { Hex } from '../../Hex/types.js'
import { Hex_validate } from '../../Hex/validate.js'
import { Rlp_toHex } from '../../Rlp/to.js'
import { Signature_fromTuple } from '../../Signature/fromTuple.js'

/**
 * Deserializes a {@link ox#TransactionEnvelope.Eip2930} from its serialized form.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip2930 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip2930.deserialize('0x01ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
 * // @log: {
 * // @log:   type: 'eip2930',
 * // @log:   nonce: 785n,
 * // @log:   gasPrice: 2000000000n,
 * // @log:   gas: 1000000n,
 * // @log:   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 * // @log:   value: 1000000000000000000n,
 * // @log: }
 * ```
 *
 * @param serializedTransaction - The serialized transaction.
 * @returns Deserialized Transaction Envelope.
 */
export function deserialize(
  serializedTransaction: TransactionEnvelopeEip2930.Serialized,
): TransactionEnvelopeEip2930.TransactionEnvelope {
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
    throw new TransactionEnvelope.InvalidSerializedError({
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
  } as TransactionEnvelopeEip2930.TransactionEnvelope
  if (Hex_validate(to) && to !== '0x') transaction.to = to
  if (Hex_validate(gas) && gas !== '0x') transaction.gas = BigInt(gas)
  if (Hex_validate(data) && data !== '0x') transaction.data = data
  if (Hex_validate(nonce) && nonce !== '0x') transaction.nonce = BigInt(nonce)
  if (Hex_validate(value) && value !== '0x') transaction.value = BigInt(value)
  if (Hex_validate(gasPrice) && gasPrice !== '0x')
    transaction.gasPrice = BigInt(gasPrice)
  if (accessList!.length !== 0 && accessList !== '0x')
    transaction.accessList = AccessList_fromTupleList(accessList as any)

  const signature =
    r && s && yParity ? Signature_fromTuple([yParity, r, s]) : undefined
  if (signature)
    transaction = {
      ...transaction,
      ...signature,
    } as TransactionEnvelopeEip2930.TransactionEnvelope

  TransactionEnvelopeEip2930.assert(transaction)

  return transaction
}

export declare namespace deserialize {
  type ErrorType = Errors.GlobalErrorType
}

deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as deserialize.ErrorType
