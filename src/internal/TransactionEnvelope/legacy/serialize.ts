import type { GlobalErrorType } from '../../Errors/error.js'
import { Hex_from } from '../../Hex/from.js'
import { Hex_trimLeft } from '../../Hex/trim.js'
import { Rlp_fromHex } from '../../Rlp/from.js'
import { InvalidSignatureVError } from '../../Signature/errors.js'
import type { Signature } from '../../Signature/types.js'
import type { PartialBy } from '../../types.js'
import { TransactionEnvelopeLegacy_assert } from './assert.js'
import type {
  TransactionEnvelopeLegacy,
  TransactionEnvelopeLegacy_Serialized,
} from './types.js'

/**
 * Serializes a {@link ox#TransactionEnvelope.Legacy}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { TransactionEnvelopeLegacy } from 'ox'
 *
 * const envelope = TransactionEnvelopeLegacy.from({
 *   chainId: 1,
 *   gasPrice: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const serialized = TransactionEnvelopeLegacy.serialize(envelope) // [!code focus]
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the serialized Transaction Envelope.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1, TransactionEnvelopeLegacy, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeLegacy.from({
 *   chainId: 1,
 *   gasPrice: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelopeLegacy.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const serialized = TransactionEnvelopeLegacy.serialize(envelope, { // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 *
 * // ... send `serialized` transaction to JSON-RPC `eth_sendRawTransaction`
 * ```
 *
 * @param envelope - The Transaction Envelope to serialize.
 * @param options -
 * @returns The serialized Transaction Envelope.
 */
export function TransactionEnvelopeLegacy_serialize(
  envelope: PartialBy<TransactionEnvelopeLegacy, 'type'>,
  options: TransactionEnvelopeLegacy_serialize.Options = {},
): TransactionEnvelopeLegacy_Serialized {
  const { chainId = 0, gas, data, input, nonce, to, value, gasPrice } = envelope

  TransactionEnvelopeLegacy_assert(envelope)

  let serializedTransaction = [
    nonce ? Hex_from(nonce) : '0x',
    gasPrice ? Hex_from(gasPrice) : '0x',
    gas ? Hex_from(gas) : '0x',
    to ?? '0x',
    value ? Hex_from(value) : '0x',
    data ?? input ?? '0x',
  ]

  const signature = (() => {
    if (options.signature)
      return {
        r: options.signature.r,
        s: options.signature.s,
        v: options.signature.yParity === 0 ? 27 : 28,
      }

    if (typeof envelope.r === 'undefined' || typeof envelope.s === 'undefined')
      return undefined
    return {
      r: envelope.r,
      s: envelope.s,
      v: envelope.v!,
    }
  })()

  if (signature) {
    const v = (() => {
      // EIP-155 (inferred chainId)
      if (signature.v >= 35) {
        const inferredChainId = Math.floor((signature.v - 35) / 2)
        if (inferredChainId > 0) return signature.v
        return 27 + (signature.v === 35 ? 0 : 1)
      }

      // EIP-155 (explicit chainId)
      if (chainId > 0) return chainId * 2 + 35 + signature.v - 27

      // Pre-EIP-155 (no chainId)
      const v = 27 + (signature.v === 27 ? 0 : 1)
      if (signature.v !== v)
        throw new InvalidSignatureVError({ value: signature.v })
      return v
    })()

    serializedTransaction = [
      ...serializedTransaction,
      Hex_from(v),
      signature.r === 0n ? '0x' : Hex_trimLeft(Hex_from(signature.r)),
      signature.s === 0n ? '0x' : Hex_trimLeft(Hex_from(signature.s)),
    ]
  } else if (chainId > 0)
    serializedTransaction = [
      ...serializedTransaction,
      Hex_from(chainId),
      '0x',
      '0x',
    ]

  return Rlp_fromHex(serializedTransaction) as never
}

export declare namespace TransactionEnvelopeLegacy_serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ErrorType =
    | TransactionEnvelopeLegacy_assert.ErrorType
    | Hex_from.ErrorType
    | Hex_trimLeft.ErrorType
    | Rlp_fromHex.ErrorType
    | InvalidSignatureVError
    | GlobalErrorType
}

TransactionEnvelopeLegacy_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeLegacy_serialize.ErrorType
