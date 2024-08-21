import { serializeAccessList } from '../accessList/serializeAccessList.js'
import { concatHex } from '../data/concat.js'
import { trimLeft } from '../data/trim.js'
import type { GlobalErrorType } from '../errors/error.js'
import { InvalidSignatureVError } from '../errors/signature.js'
import { TransactionTypeNotImplementedError } from '../errors/transactionEnvelope.js'
import { toHex } from '../hex/toHex.js'
import { encodeRlp } from '../rlp/encode.js'
import { toSignatureTuple } from '../signature/toSignatureTuple.js'
import type { Signature } from '../types/signature.js'
import type {
  TransactionEnvelope,
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip2930,
  TransactionEnvelopeLegacy,
  TransactionEnvelopeSerialized,
  TransactionEnvelopeSerializedEip1559,
  TransactionEnvelopeSerializedEip2930,
  TransactionEnvelopeSerializedLegacy,
} from '../types/transactionEnvelope.js'
import type { PartialBy } from '../types/utils.js'
import {
  assertTransactionEnvelopeEip1559,
  assertTransactionEnvelopeEip2930,
  assertTransactionEnvelopeLegacy,
} from './assertTransactionEnvelope.js'

/**
 * Serializes a {@link TransactionEnvelope}.
 *
 * @example
 * // TODO
 */
export function serializeTransactionEnvelope<
  envelope extends TransactionEnvelope,
>(
  envelope: envelope,
  options: serializeTransactionEnvelope.Options = {},
): serializeTransactionEnvelope.ReturnType<envelope> {
  if (envelope.type === 'legacy')
    return serializeTransactionEnvelopeLegacy(envelope, options) as never
  if (envelope.type === 'eip2930')
    return serializeTransactionEnvelopeEip2930(envelope, options) as never
  if (envelope.type === 'eip1559')
    return serializeTransactionEnvelopeEip1559(envelope, options) as never

  // TODO: EIP-4844, EIP-7702

  throw new TransactionTypeNotImplementedError({ type: envelope.type })
}

export declare namespace serializeTransactionEnvelope {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ReturnType<envelope extends TransactionEnvelope = TransactionEnvelope> =
    TransactionEnvelopeSerialized<envelope['type']>

  type ErrorType =
    | serializeTransactionEnvelopeLegacy.ErrorType
    | serializeTransactionEnvelopeEip2930.ErrorType
    | serializeTransactionEnvelopeEip1559.ErrorType
    | TransactionTypeNotImplementedError
    | GlobalErrorType
}

/**
 * Serializes a legacy {@link TransactionEnvelope}.
 *
 * @example
 * // TODO
 */
export function serializeTransactionEnvelopeLegacy(
  envelope: PartialBy<TransactionEnvelopeLegacy, 'type'>,
  options: serializeTransactionEnvelopeLegacy.Options = {},
): serializeTransactionEnvelopeLegacy.ReturnType {
  const { chainId = 0, gas, data, input, nonce, to, value, gasPrice } = envelope

  assertTransactionEnvelopeLegacy(envelope)

  let serializedTransaction = [
    nonce ? toHex(nonce) : '0x',
    gasPrice ? toHex(gasPrice) : '0x',
    gas ? toHex(gas) : '0x',
    to ?? '0x',
    value ? toHex(value) : '0x',
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
      toHex(v),
      signature.r === 0n ? '0x' : trimLeft(toHex(signature.r)),
      signature.s === 0n ? '0x' : trimLeft(toHex(signature.s)),
    ]
  } else if (chainId > 0)
    serializedTransaction = [
      ...serializedTransaction,
      toHex(chainId),
      '0x',
      '0x',
    ]

  return encodeRlp(serializedTransaction) as TransactionEnvelopeSerializedLegacy
}

export declare namespace serializeTransactionEnvelopeLegacy {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ReturnType = TransactionEnvelopeSerializedLegacy

  type ErrorType =
    | assertTransactionEnvelopeLegacy.ErrorType
    | toHex.ErrorType
    | trimLeft.ErrorType
    | toSignatureTuple.ErrorType
    | concatHex.ErrorType
    | encodeRlp.ErrorType
    | InvalidSignatureVError
    | GlobalErrorType
}

/**
 * Serializes an EIP-2930 {@link TransactionEnvelope}.
 *
 * @example
 * // TODO
 */
export function serializeTransactionEnvelopeEip2930(
  envelope: PartialBy<TransactionEnvelopeEip2930, 'type'>,
  options: serializeTransactionEnvelopeEip2930.Options = {},
): serializeTransactionEnvelopeEip2930.ReturnType {
  const { chainId, gas, data, input, nonce, to, value, accessList, gasPrice } =
    envelope
  const { signature } = options

  assertTransactionEnvelopeEip2930(envelope)

  const serializedAccessList = serializeAccessList(accessList)

  const serializedTransaction = [
    toHex(chainId),
    nonce ? toHex(nonce) : '0x',
    gasPrice ? toHex(gasPrice) : '0x',
    gas ? toHex(gas) : '0x',
    to ?? '0x',
    value ? toHex(value) : '0x',
    data ?? input ?? '0x',
    serializedAccessList,
    ...toSignatureTuple(signature || envelope),
  ] as const

  return concatHex(
    '0x01',
    encodeRlp(serializedTransaction),
  ) as TransactionEnvelopeSerializedEip2930
}

export declare namespace serializeTransactionEnvelopeEip2930 {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ReturnType = TransactionEnvelopeSerializedEip2930

  type ErrorType =
    | assertTransactionEnvelopeEip2930.ErrorType
    | toHex.ErrorType
    | trimLeft.ErrorType
    | toSignatureTuple.ErrorType
    | concatHex.ErrorType
    | encodeRlp.ErrorType
    | GlobalErrorType
}

/**
 * Serializes an EIP-1559 {@link TransactionEnvelope}.
 *
 * @example
 * // TODO
 */
export function serializeTransactionEnvelopeEip1559(
  envelope: PartialBy<TransactionEnvelopeEip1559, 'type'>,
  options: serializeTransactionEnvelopeEip1559.Options = {},
): serializeTransactionEnvelopeEip1559.ReturnType {
  const {
    chainId,
    gas,
    nonce,
    to,
    value,
    maxFeePerGas,
    maxPriorityFeePerGas,
    accessList,
    data,
    input,
  } = envelope
  const { signature } = options

  assertTransactionEnvelopeEip1559(envelope)

  const serializedAccessList = serializeAccessList(accessList)

  const serializedTransaction = [
    toHex(chainId),
    nonce ? toHex(nonce) : '0x',
    maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? toHex(maxFeePerGas) : '0x',
    gas ? toHex(gas) : '0x',
    to ?? '0x',
    value ? toHex(value) : '0x',
    data ?? input ?? '0x',
    serializedAccessList,
    ...toSignatureTuple(signature || envelope),
  ]

  return concatHex(
    '0x02',
    encodeRlp(serializedTransaction),
  ) as TransactionEnvelopeSerializedEip1559
}

export declare namespace serializeTransactionEnvelopeEip1559 {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ReturnType = TransactionEnvelopeSerializedEip1559

  type ErrorType =
    | assertTransactionEnvelopeEip1559.ErrorType
    | toHex.ErrorType
    | trimLeft.ErrorType
    | toSignatureTuple.ErrorType
    | concatHex.ErrorType
    | encodeRlp.ErrorType
    | GlobalErrorType
}
