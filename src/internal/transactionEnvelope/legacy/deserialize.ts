import type { GlobalErrorType } from '../../errors/error.js'
import { Hex_isHex } from '../../hex/isHex.js'
import type { Hex } from '../../hex/types.js'
import { Rlp_toHex } from '../../rlp/to.js'
import { InvalidSignatureVError } from '../../signature/errors.js'
import type { Compute } from '../../types.js'
import { InvalidSerializedTransactionError } from '../errors.js'
import { TransactionEnvelopeLegacy_assert } from './assert.js'
import type { TransactionEnvelopeLegacy } from './types.js'

/**
 * Deserializes a {@link TransactionEnvelopeLegacy#TransactionEnvelopeLegacy} from its serialized form.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelopeLegacy.deserialize('0x01ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
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
export function TransactionEnvelopeLegacy_deserialize(
  serializedTransaction: Hex,
): TransactionEnvelopeLegacy_deserialize.ReturnType {
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
  } as TransactionEnvelopeLegacy
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
  transaction.s = s === '0x' ? 0n : BigInt(s!)
  transaction.r = r === '0x' ? 0n : BigInt(r!)

  TransactionEnvelopeLegacy_assert(transaction)

  return transaction
}

export declare namespace TransactionEnvelopeLegacy_deserialize {
  type ReturnType = Compute<TransactionEnvelopeLegacy>

  type ErrorType = GlobalErrorType
}

TransactionEnvelopeLegacy_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeLegacy_deserialize.ErrorType
