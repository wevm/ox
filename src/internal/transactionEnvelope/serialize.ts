import { AccessList_toTupleList } from '../accessList/toTupleList.js'
import type { BlobSidecars } from '../blobs/types.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Hex_concat } from '../hex/concat.js'
import { Hex_from } from '../hex/from.js'
import { Hex_trimLeft } from '../hex/trim.js'
import type { Hex } from '../hex/types.js'
import { Rlp_fromHex } from '../rlp/from.js'
import { InvalidSignatureVError } from '../signature/errors.js'
import { Signature_extract } from '../signature/extract.js'
import { Signature_toTuple } from '../signature/toTuple.js'
import type { Signature } from '../signature/types.js'
import type { PartialBy } from '../types.js'
import {
  TransactionEnvelope_assertEip1559,
  TransactionEnvelope_assertEip2930,
  TransactionEnvelope_assertEip4844,
  TransactionEnvelope_assertLegacy,
} from './assert.js'
import { TransactionTypeNotImplementedError } from './errors.js'
import type {
  TransactionEnvelope,
  TransactionEnvelope_Eip1559,
  TransactionEnvelope_Eip2930,
  TransactionEnvelope_Eip4844,
  TransactionEnvelope_Legacy,
  TransactionEnvelope_Serialized,
  TransactionEnvelope_SerializedEip1559,
  TransactionEnvelope_SerializedEip2930,
  TransactionEnvelope_SerializedEip4844,
  TransactionEnvelope_SerializedLegacy,
} from './types.js'

/**
 * Serializes a {@link TransactionEnvelope#TransactionEnvelope}.
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
export function TransactionEnvelope_serialize<
  envelope extends TransactionEnvelope,
>(
  envelope: envelope,
  options: TransactionEnvelope_serialize.Options = {},
): TransactionEnvelope_serialize.ReturnType<envelope> {
  if (envelope.type === 'legacy')
    return TransactionEnvelope_serializeLegacy(envelope, options) as never
  if (envelope.type === 'eip2930')
    return TransactionEnvelope_serializeEip2930(envelope, options) as never
  if (envelope.type === 'eip1559')
    return TransactionEnvelope_serializeEip1559(envelope, options) as never
  if (envelope.type === 'eip4844')
    return TransactionEnvelope_serializeEip4844(envelope, options) as never

  // TODO: EIP-7702

  throw new TransactionTypeNotImplementedError({ type: envelope.type })
}

export declare namespace TransactionEnvelope_serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
    /** (EIP-4844 only) Sidecars to append to the serialized Transaction Envelope. */
    sidecars?: BlobSidecars<Hex> | undefined
  }

  type ReturnType<envelope extends TransactionEnvelope = TransactionEnvelope> =
    TransactionEnvelope_Serialized<envelope['type']>

  type ErrorType =
    | TransactionEnvelope_serializeLegacy.ErrorType
    | TransactionEnvelope_serializeEip2930.ErrorType
    | TransactionEnvelope_serializeEip1559.ErrorType
    | TransactionEnvelope_serializeEip4844.ErrorType
    | TransactionTypeNotImplementedError
    | GlobalErrorType
}

TransactionEnvelope_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_serialize.ErrorType

/**
 * Serializes a {@link TransactionEnvelope#Legacy}.
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
export function TransactionEnvelope_serializeLegacy(
  envelope: PartialBy<TransactionEnvelope_Legacy, 'type'>,
  options: TransactionEnvelope_serializeLegacy.Options = {},
): TransactionEnvelope_serializeLegacy.ReturnType {
  const { chainId = 0, gas, data, input, nonce, to, value, gasPrice } = envelope

  TransactionEnvelope_assertLegacy(envelope)

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

  return Rlp_fromHex(
    serializedTransaction,
  ) as TransactionEnvelope_SerializedLegacy
}

export declare namespace TransactionEnvelope_serializeLegacy {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ReturnType = TransactionEnvelope_SerializedLegacy

  type ErrorType =
    | TransactionEnvelope_assertLegacy.ErrorType
    | Hex_from.ErrorType
    | Hex_trimLeft.ErrorType
    | Signature_toTuple.ErrorType
    | Hex_concat.ErrorType
    | Rlp_fromHex.ErrorType
    | InvalidSignatureVError
    | GlobalErrorType
}

TransactionEnvelope_serializeLegacy.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_serializeLegacy.ErrorType

/**
 * Serializes a {@link TransactionEnvelope#Eip2930}.
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
export function TransactionEnvelope_serializeEip2930(
  envelope: PartialBy<TransactionEnvelope_Eip2930, 'type'>,
  options: TransactionEnvelope_serializeEip2930.Options = {},
): TransactionEnvelope_serializeEip2930.ReturnType {
  const { chainId, gas, data, input, nonce, to, value, accessList, gasPrice } =
    envelope

  TransactionEnvelope_assertEip2930(envelope)

  const accessTupleList = AccessList_toTupleList(accessList)

  const signature = Signature_extract(options.signature || envelope)

  const serializedTransaction = [
    Hex_from(chainId),
    nonce ? Hex_from(nonce) : '0x',
    gasPrice ? Hex_from(gasPrice) : '0x',
    gas ? Hex_from(gas) : '0x',
    to ?? '0x',
    value ? Hex_from(value) : '0x',
    data ?? input ?? '0x',
    accessTupleList,
    ...(signature ? Signature_toTuple(signature) : []),
  ] as const

  return Hex_concat(
    '0x01',
    Rlp_fromHex(serializedTransaction),
  ) as TransactionEnvelope_SerializedEip2930
}

export declare namespace TransactionEnvelope_serializeEip2930 {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ReturnType = TransactionEnvelope_SerializedEip2930

  type ErrorType =
    | TransactionEnvelope_assertEip2930.ErrorType
    | Hex_from.ErrorType
    | Hex_trimLeft.ErrorType
    | Signature_toTuple.ErrorType
    | Hex_concat.ErrorType
    | Rlp_fromHex.ErrorType
    | GlobalErrorType
}

TransactionEnvelope_serializeEip2930.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_serializeEip2930.ErrorType

/**
 * Serializes a {@link TransactionEnvelope#Eip1559}.
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
export function TransactionEnvelope_serializeEip1559(
  envelope: PartialBy<TransactionEnvelope_Eip1559, 'type'>,
  options: TransactionEnvelope_serializeEip1559.Options = {},
): TransactionEnvelope_serializeEip1559.ReturnType {
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

  TransactionEnvelope_assertEip1559(envelope)

  const accessTupleList = AccessList_toTupleList(accessList)

  const signature = Signature_extract(options.signature || envelope)

  const serializedTransaction = [
    Hex_from(chainId),
    nonce ? Hex_from(nonce) : '0x',
    maxPriorityFeePerGas ? Hex_from(maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? Hex_from(maxFeePerGas) : '0x',
    gas ? Hex_from(gas) : '0x',
    to ?? '0x',
    value ? Hex_from(value) : '0x',
    data ?? input ?? '0x',
    accessTupleList,
    ...(signature ? Signature_toTuple(signature) : []),
  ]

  return Hex_concat(
    '0x02',
    Rlp_fromHex(serializedTransaction),
  ) as TransactionEnvelope_SerializedEip1559
}

export declare namespace TransactionEnvelope_serializeEip1559 {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
  }

  type ReturnType = TransactionEnvelope_SerializedEip1559

  type ErrorType =
    | TransactionEnvelope_assertEip1559.ErrorType
    | Hex_from.ErrorType
    | Hex_trimLeft.ErrorType
    | Signature_toTuple.ErrorType
    | Hex_concat.ErrorType
    | Rlp_fromHex.ErrorType
    | GlobalErrorType
}

TransactionEnvelope_serializeEip1559.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_serializeEip1559.ErrorType

/**
 * Serializes a {@link TransactionEnvelope#Eip4844}.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelope_serializeEip4844(
  envelope: PartialBy<TransactionEnvelope_Eip4844, 'type'>,
  options: TransactionEnvelope_serializeEip4844.Options = {},
): TransactionEnvelope_serializeEip4844.ReturnType {
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

  TransactionEnvelope_assertEip4844(envelope)

  const accessTupleList = AccessList_toTupleList(accessList)

  const signature = Signature_extract(options.signature || envelope)

  const serializedTransaction = [
    Hex_from(chainId),
    nonce ? Hex_from(nonce) : '0x',
    maxPriorityFeePerGas ? Hex_from(maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? Hex_from(maxFeePerGas) : '0x',
    gas ? Hex_from(gas) : '0x',
    to ?? '0x',
    value ? Hex_from(value) : '0x',
    data ?? '0x',
    accessTupleList,
    maxFeePerBlobGas ? Hex_from(maxFeePerBlobGas) : '0x',
    blobVersionedHashes ?? [],
    ...(signature ? Signature_toTuple(signature) : []),
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

  return Hex_concat(
    '0x03',
    sidecars
      ? // If sidecars are provided, envelope turns into a "network wrapper":
        Rlp_fromHex([serializedTransaction, blobs, commitments, proofs])
      : // Otherwise, standard envelope is used:
        Rlp_fromHex(serializedTransaction),
  ) as TransactionEnvelope_SerializedEip4844
}

export declare namespace TransactionEnvelope_serializeEip4844 {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
    /** Sidecars to append to the serialized Transaction Envelope. */
    sidecars?: BlobSidecars<Hex> | undefined
  }

  type ReturnType = TransactionEnvelope_SerializedEip4844

  type ErrorType =
    | TransactionEnvelope_assertEip4844.ErrorType
    | Hex_from.ErrorType
    | Hex_trimLeft.ErrorType
    | Signature_toTuple.ErrorType
    | Hex_concat.ErrorType
    | Rlp_fromHex.ErrorType
    | GlobalErrorType
}

TransactionEnvelope_serializeEip4844.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_serializeEip4844.ErrorType
