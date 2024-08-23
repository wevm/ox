import { toAccessTupleList } from '../accessList/toAccessTupleList.js'
import { concatHex } from '../data/concat.js'
import { trimLeft } from '../data/trim.js'
import type { GlobalErrorType } from '../errors/error.js'
import { InvalidSignatureVError } from '../errors/signature.js'
import { TransactionTypeNotImplementedError } from '../errors/transactionEnvelope.js'
import { toHex } from '../hex/toHex.js'
import { encodeRlp } from '../rlp/encodeRlp.js'
import { extractSignature } from '../signature/extractSignature.js'
import { toSignatureTuple } from '../signature/toSignatureTuple.js'
import type { BlobSidecars } from '../types/blob.js'
import type { Hex } from '../types/data.js'
import type { Signature } from '../types/signature.js'
import type {
  TransactionEnvelope,
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip4844,
  TransactionEnvelopeLegacy,
  TransactionEnvelopeSerialized,
  TransactionEnvelopeSerializedEip1559,
  TransactionEnvelopeSerializedEip2930,
  TransactionEnvelopeSerializedEip4844,
  TransactionEnvelopeSerializedLegacy,
} from '../types/transactionEnvelope.js'
import type { PartialBy } from '../types/utils.js'
import {
  assertTransactionEnvelopeEip1559,
  assertTransactionEnvelopeEip2930,
  assertTransactionEnvelopeEip4844,
  assertTransactionEnvelopeLegacy,
} from './assertTransactionEnvelope.js'

/**
 * Serializes a {@link TransactionEnvelope}.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const serialized = TransactionEnvelope.serialize(envelope)
 * // '0x...'
 * ```
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
  if (envelope.type === 'eip4844')
    return serializeTransactionEnvelopeEip4844(envelope, options) as never

  // TODO: EIP-7702

  throw new TransactionTypeNotImplementedError({ type: envelope.type })
}

export declare namespace serializeTransactionEnvelope {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
    /** (EIP-4844 only) Sidecars to append to the serialized Transaction Envelope. */
    sidecars?: BlobSidecars<Hex> | undefined
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

serializeTransactionEnvelope.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as serializeTransactionEnvelope.ErrorType

/**
 * Serializes a legacy {@link TransactionEnvelope}.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.fromLegacy({
 *   gasPrice: 1000000n,
 *   to: '0x0000000000000000000000000000000000000000',
 * })
 *
 * const serialized = TransactionEnvelope.serializeLegacy(envelope)
 * // '0x...'
 * ```
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

serializeTransactionEnvelopeLegacy.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as serializeTransactionEnvelopeLegacy.ErrorType

/**
 * Serializes an EIP-2930 {@link TransactionEnvelope}.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.fromEip2930({
 *   accessList: [...],
 *   gasPrice: 1000000n,
 *   to: '0x0000000000000000000000000000000000000000',
 * })
 *
 * const serialized = TransactionEnvelope.serializeEip2930(envelope)
 * // '0x01...'
 * ```
 */
export function serializeTransactionEnvelopeEip2930(
  envelope: PartialBy<TransactionEnvelopeEip2930, 'type'>,
  options: serializeTransactionEnvelopeEip2930.Options = {},
): serializeTransactionEnvelopeEip2930.ReturnType {
  const { chainId, gas, data, input, nonce, to, value, accessList, gasPrice } =
    envelope

  assertTransactionEnvelopeEip2930(envelope)

  const accessTupleList = toAccessTupleList(accessList)

  const signature = extractSignature(options.signature || envelope)

  const serializedTransaction = [
    toHex(chainId),
    nonce ? toHex(nonce) : '0x',
    gasPrice ? toHex(gasPrice) : '0x',
    gas ? toHex(gas) : '0x',
    to ?? '0x',
    value ? toHex(value) : '0x',
    data ?? input ?? '0x',
    accessTupleList,
    ...(signature ? toSignatureTuple(signature) : []),
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

serializeTransactionEnvelopeEip2930.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as serializeTransactionEnvelopeEip2930.ErrorType

/**
 * Serializes an EIP-1559 {@link TransactionEnvelope}.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.fromEip1559({
 *   maxFeePerGas: 1000000n,
 *   to: '0x0000000000000000000000000000000000000000',
 * })
 *
 * const serialized = TransactionEnvelope.serializeEip1559(envelope)
 * // '0x02...'
 * ```
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

  assertTransactionEnvelopeEip1559(envelope)

  const accessTupleList = toAccessTupleList(accessList)

  const signature = extractSignature(options.signature || envelope)

  const serializedTransaction = [
    toHex(chainId),
    nonce ? toHex(nonce) : '0x',
    maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? toHex(maxFeePerGas) : '0x',
    gas ? toHex(gas) : '0x',
    to ?? '0x',
    value ? toHex(value) : '0x',
    data ?? input ?? '0x',
    accessTupleList,
    ...(signature ? toSignatureTuple(signature) : []),
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

serializeTransactionEnvelopeEip1559.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as serializeTransactionEnvelopeEip1559.ErrorType

/**
 * Serializes an EIP-4844 {@link TransactionEnvelope}.
 *
 * @example
 * // TODO
 */
export function serializeTransactionEnvelopeEip4844(
  envelope: PartialBy<TransactionEnvelopeEip4844, 'type'>,
  options: serializeTransactionEnvelopeEip4844.Options = {},
): serializeTransactionEnvelopeEip4844.ReturnType {
  const {
    blobVersionedHashes,
    chainId,
    gas,
    nonce,
    to,
    value,
    maxFeePerBlobGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    accessList,
    data,
  } = envelope

  assertTransactionEnvelopeEip4844(envelope)

  const accessTupleList = toAccessTupleList(accessList)

  const signature = extractSignature(options.signature || envelope)

  const serializedTransaction = [
    toHex(chainId),
    nonce ? toHex(nonce) : '0x',
    maxPriorityFeePerGas ? toHex(maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? toHex(maxFeePerGas) : '0x',
    gas ? toHex(gas) : '0x',
    to ?? '0x',
    value ? toHex(value) : '0x',
    data ?? '0x',
    accessTupleList,
    maxFeePerBlobGas ? toHex(maxFeePerBlobGas) : '0x',
    blobVersionedHashes ?? [],
    ...(signature ? toSignatureTuple(signature) : []),
  ] as const

  const sidecars = options.sidecars || envelope.sidecars
  const blobs: Hex[] = []
  const commitments: Hex[] = []
  const proofs: Hex[] = []
  if (sidecars)
    for (let i = 0; i < sidecars.length; i++) {
      const { blob, commitment, proof } = sidecars[i]!
      blobs.push(blob)
      commitments.push(commitment)
      proofs.push(proof)
    }

  return concatHex(
    '0x03',
    sidecars
      ? // If sidecars are provided, envelope turns into a "network wrapper":
        encodeRlp([serializedTransaction, blobs, commitments, proofs])
      : // Otherwise, standard envelope is used:
        encodeRlp(serializedTransaction),
  ) as TransactionEnvelopeSerializedEip4844
}

export declare namespace serializeTransactionEnvelopeEip4844 {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
    /** Sidecars to append to the serialized Transaction Envelope. */
    sidecars?: BlobSidecars<Hex> | undefined
  }

  type ReturnType = TransactionEnvelopeSerializedEip4844

  type ErrorType =
    | assertTransactionEnvelopeEip1559.ErrorType
    | toHex.ErrorType
    | trimLeft.ErrorType
    | toSignatureTuple.ErrorType
    | concatHex.ErrorType
    | encodeRlp.ErrorType
    | GlobalErrorType
}

serializeTransactionEnvelopeEip1559.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as serializeTransactionEnvelopeEip1559.ErrorType
