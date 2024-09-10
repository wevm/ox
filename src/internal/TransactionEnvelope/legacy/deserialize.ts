import type { GlobalErrorType } from '../../Errors/error.js'
import { Hex_isHex } from '../../Hex/isHex.js'
import type { Hex } from '../../Hex/types.js'
import { Rlp_toHex } from '../../Rlp/to.js'
import { Signature_InvalidVError } from '../../Signature/errors.js'
import { Signature_vToYParity } from '../../Signature/vToYParity.js'
import type { Compute } from '../../types.js'
import { TransactionEnvelope_InvalidSerializedError } from '../errors.js'
import { TransactionEnvelopeLegacy_assert } from './assert.js'
import type { TransactionEnvelopeLegacy } from './types.js'

/**
 * Deserializes a {@link ox#TransactionEnvelopeLegacy.TransactionEnvelopeLegacy} from its serialized form.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeLegacy } from 'ox'
 *
 * const envelope = TransactionEnvelopeLegacy.deserialize('0x01ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
 * // @log: {
 * // @log:   type: 'legacy',
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
export function TransactionEnvelopeLegacy_deserialize(
  serializedTransaction: Hex,
): Compute<TransactionEnvelopeLegacy> {
  const tuple = Rlp_toHex(serializedTransaction)

  const [nonce, gasPrice, gas, to, value, data, chainIdOrV_, r, s] =
    tuple as readonly Hex[]

  if (!(tuple.length === 6 || tuple.length === 9))
    throw new TransactionEnvelope_InvalidSerializedError({
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
  else if (v !== 27 && v !== 28) throw new Signature_InvalidVError({ value: v })

  transaction.yParity = Signature_vToYParity(v)
  transaction.v = v
  transaction.s = s === '0x' ? 0n : BigInt(s!)
  transaction.r = r === '0x' ? 0n : BigInt(r!)

  TransactionEnvelopeLegacy_assert(transaction)

  return transaction
}

export declare namespace TransactionEnvelopeLegacy_deserialize {
  type ErrorType = GlobalErrorType
}

TransactionEnvelopeLegacy_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeLegacy_deserialize.ErrorType
