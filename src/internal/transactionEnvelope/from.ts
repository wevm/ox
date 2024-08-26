import type { GlobalErrorType } from '../errors/error.js'
import type { Signature } from '../types/signature.js'
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
  TransactionEnvelope_SerializedLegacy,
} from '../types/transactionEnvelope.js'
import type { Compute, IsNarrowable, UnionPartialBy } from '../types/utils.js'
import {
  TransactionEnvelope_assert,
  TransactionEnvelope_assertEip1559,
  TransactionEnvelope_assertEip2930,
  TransactionEnvelope_assertEip4844,
  TransactionEnvelope_assertEip7702,
  TransactionEnvelope_assertLegacy,
} from './assert.js'
import {
  TransactionEnvelope_deserialize,
  TransactionEnvelope_deserializeEip1559,
  TransactionEnvelope_deserializeEip2930,
  TransactionEnvelope_deserializeLegacy,
} from './deserialize.js'
import {
  type GetTransactionType,
  TransactionEnvelope_getType,
} from './getType.js'

/**
 * Converts an arbitrary transaction object into a typed Transaction Envelope.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope, Value } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * // {
 * //   chainId: 1,
 * //   maxFeePerGas: 10000000000n,
 * //   maxPriorityFeePerGas: 1000000000n,
 * //   to: '0x0000000000000000000000000000000000000000',
 * //   type: 'eip1559',
 * //   value: 1000000000000000000n,
 * // }
 * ```
 */
export function TransactionEnvelope_from<
  const envelope extends
    | UnionPartialBy<TransactionEnvelope, 'type'>
    | TransactionEnvelope_Serialized,
>(
  envelope: envelope,
  options: TransactionEnvelope_from.Options = {},
): TransactionEnvelope_from.ReturnType<envelope> {
  const { signature } = options

  if (typeof envelope === 'string') {
    const envelope_ = TransactionEnvelope_deserialize(envelope)
    return { ...envelope_, ...signature } as never
  }

  const type = TransactionEnvelope_getType(envelope)
  const envelope_ = { ...envelope, ...signature, type } as never
  TransactionEnvelope_assert(envelope_)
  return envelope_
}

export declare namespace TransactionEnvelope_from {
  type Options = {
    signature?: Signature
  }

  type ReturnType<
    envelope extends
      | UnionPartialBy<TransactionEnvelope, 'type'>
      | TransactionEnvelope_Serialized =
      | UnionPartialBy<TransactionEnvelope, 'type'>
      | TransactionEnvelope_Serialized,
  > = Compute<
    envelope extends TransactionEnvelope_Serialized
      ? TransactionEnvelope_deserialize.ReturnType<envelope>
      : envelope extends UnionPartialBy<TransactionEnvelope, 'type'>
        ? IsNarrowable<GetTransactionType<envelope>, string> extends true
          ? envelope & { readonly type: GetTransactionType<envelope> }
          : never
        : never
  >

  type ErrorType =
    | TransactionEnvelope_assert.ErrorType
    | TransactionEnvelope_deserialize.ErrorType
    | TransactionEnvelope_getType.ErrorType
    | GlobalErrorType
}

TransactionEnvelope_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_from.ErrorType

/**
 * Converts an arbitrary transaction object into a legacy Transaction Envelope.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope, Value } from 'ox'
 *
 * const envelope = TransactionEnvelope.fromLegacy({
 *   chainId: 1,
 *   gasPrice: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * ```
 */
export function TransactionEnvelope_fromLegacy<
  const envelope extends
    | UnionPartialBy<TransactionEnvelope_Legacy, 'type'>
    | TransactionEnvelope_SerializedLegacy,
>(envelope: envelope): TransactionEnvelope_fromLegacy.ReturnType<envelope> {
  if (typeof envelope === 'string')
    return TransactionEnvelope_deserializeLegacy(envelope) as never

  TransactionEnvelope_assertLegacy(envelope)
  return { ...envelope, type: 'legacy' } as never
}

export declare namespace TransactionEnvelope_fromLegacy {
  type ReturnType<
    envelope extends
      | UnionPartialBy<TransactionEnvelope_Legacy, 'type'>
      | TransactionEnvelope_SerializedLegacy =
      | UnionPartialBy<TransactionEnvelope_Legacy, 'type'>
      | TransactionEnvelope_SerializedLegacy,
  > = Compute<
    envelope extends TransactionEnvelope_SerializedLegacy
      ? TransactionEnvelope_Legacy
      : envelope & { readonly type: 'legacy' }
  >

  type ErrorType = GlobalErrorType
}

TransactionEnvelope_fromLegacy.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_fromLegacy.ErrorType

/**
 * Converts an arbitrary transaction object into an EIP-1559 Transaction Envelope.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope, Value } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * ```
 */
export function TransactionEnvelope_fromEip1559<
  const envelope extends
    | UnionPartialBy<TransactionEnvelope_Eip1559, 'type'>
    | TransactionEnvelope_SerializedEip1559,
>(envelope: envelope): TransactionEnvelope_fromEip1559.ReturnType<envelope> {
  if (typeof envelope === 'string')
    return TransactionEnvelope_deserializeEip1559(envelope) as never

  TransactionEnvelope_assertEip1559(envelope)
  return { ...envelope, type: 'eip1559' } as never
}

export declare namespace TransactionEnvelope_fromEip1559 {
  type ReturnType<
    envelope extends
      | UnionPartialBy<TransactionEnvelope_Eip1559, 'type'>
      | TransactionEnvelope_SerializedEip1559 =
      | UnionPartialBy<TransactionEnvelope_Eip1559, 'type'>
      | TransactionEnvelope_SerializedEip1559,
  > = Compute<
    envelope extends TransactionEnvelope_SerializedEip1559
      ? TransactionEnvelope_Eip1559
      : envelope & { readonly type: 'eip1559' }
  >

  type ErrorType = GlobalErrorType
}

TransactionEnvelope_fromEip1559.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_fromEip1559.ErrorType

/**
 * Converts an arbitrary transaction object into an EIP-2930 Transaction Envelope.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope, Value } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   accessList: [...],
 *   gasPrice: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * ```
 */
export function TransactionEnvelope_fromEip2930<
  const envelope extends
    | UnionPartialBy<TransactionEnvelope_Eip2930, 'type'>
    | TransactionEnvelope_SerializedEip2930,
>(envelope: envelope): TransactionEnvelope_fromEip2930.ReturnType<envelope> {
  if (typeof envelope === 'string')
    return TransactionEnvelope_deserializeEip2930(envelope) as never

  TransactionEnvelope_assertEip2930(envelope)
  return { ...envelope, type: 'eip2930' } as never
}

export declare namespace TransactionEnvelope_fromEip2930 {
  type ReturnType<
    envelope extends
      | UnionPartialBy<TransactionEnvelope_Eip2930, 'type'>
      | TransactionEnvelope_SerializedEip2930 =
      | UnionPartialBy<TransactionEnvelope_Eip2930, 'type'>
      | TransactionEnvelope_SerializedEip2930,
  > = Compute<
    envelope extends TransactionEnvelope_SerializedEip2930
      ? TransactionEnvelope_Eip2930
      : envelope & { readonly type: 'eip2930' }
  >

  type ErrorType = GlobalErrorType
}

TransactionEnvelope_fromEip2930.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_fromEip2930.ErrorType

/**
 * Converts an arbitrary transaction object into an EIP-4844 Transaction Envelope.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope, Value } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   blobVersionedHashes: [...],
 *   maxFeePerBlobGas: Value.fromGwei('3'),
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * ```
 */
export function TransactionEnvelope_fromEip4844<
  const envelope extends UnionPartialBy<TransactionEnvelope_Eip4844, 'type'>,
>(envelope: envelope): TransactionEnvelope_fromEip4844.ReturnType<envelope> {
  // TODO:
  // if (typeof envelope === 'string')
  //   return deserializeTransactionEnvelopeEip4844(envelope) as never

  TransactionEnvelope_assertEip4844(envelope)
  return { ...envelope, type: 'eip4844' } as never
}

export declare namespace TransactionEnvelope_fromEip4844 {
  type ReturnType<
    envelope extends UnionPartialBy<
      TransactionEnvelope_Eip4844,
      'type'
    > = UnionPartialBy<TransactionEnvelope_Eip4844, 'type'>,
  > = Compute<envelope & { readonly type: 'eip4844' }>

  type ErrorType = GlobalErrorType
}

TransactionEnvelope_fromEip4844.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_fromEip4844.ErrorType

/**
 * Converts an arbitrary transaction object into an EIP-7702 Transaction Envelope.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope, Value } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   authorizationList: [...],
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * ```
 */
export function TransactionEnvelope_fromEip7702<
  const envelope extends UnionPartialBy<TransactionEnvelope_Eip7702, 'type'>,
>(envelope: envelope): TransactionEnvelope_fromEip7702.ReturnType<envelope> {
  // TODO:
  // if (typeof envelope === 'string')
  //   return deserializeTransactionEnvelopeEip7702(envelope) as never

  TransactionEnvelope_assertEip7702(envelope)
  return { ...envelope, type: 'eip7702' } as never
}

export declare namespace TransactionEnvelope_fromEip7702 {
  type ReturnType<
    envelope extends UnionPartialBy<TransactionEnvelope_Eip7702, 'type'>,
  > = Compute<envelope & { readonly type: 'eip7702' }>

  type ErrorType = GlobalErrorType
}

TransactionEnvelope_fromEip7702.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_fromEip7702.ErrorType
