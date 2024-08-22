import type { GlobalErrorType } from '../errors/error.js'
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
} from '../types/transactionEnvelope.js'
import type { Compute, IsNarrowable, UnionPartialBy } from '../types/utils.js'
import {
  assertTransactionEnvelope,
  assertTransactionEnvelopeEip1559,
  assertTransactionEnvelopeEip2930,
  assertTransactionEnvelopeEip4844,
  assertTransactionEnvelopeEip7702,
  assertTransactionEnvelopeLegacy,
} from './assertTransactionEnvelope.js'
import {
  deserializeTransactionEnvelope,
  deserializeTransactionEnvelopeEip1559,
  deserializeTransactionEnvelopeEip2930,
  deserializeTransactionEnvelopeLegacy,
} from './deserializeTransactionEnvelope.js'
import {
  type GetTransactionType,
  getTransactionType,
} from './getTransactionType.js'

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
export function toTransactionEnvelope<
  const envelope extends
    | UnionPartialBy<TransactionEnvelope, 'type'>
    | TransactionEnvelopeSerialized,
>(envelope: envelope): toTransactionEnvelope.ReturnType<envelope> {
  if (typeof envelope === 'string')
    return deserializeTransactionEnvelope(envelope) as never

  const type = getTransactionType(envelope)
  const envelope_ = { ...envelope, type } as never
  assertTransactionEnvelope(envelope_)
  return envelope_
}

export declare namespace toTransactionEnvelope {
  type ReturnType<
    envelope extends
      | UnionPartialBy<TransactionEnvelope, 'type'>
      | TransactionEnvelopeSerialized =
      | UnionPartialBy<TransactionEnvelope, 'type'>
      | TransactionEnvelopeSerialized,
  > = Compute<
    envelope extends TransactionEnvelopeSerialized
      ? deserializeTransactionEnvelope.ReturnType<envelope>
      : envelope extends UnionPartialBy<TransactionEnvelope, 'type'>
        ? IsNarrowable<GetTransactionType<envelope>, string> extends true
          ? envelope & { readonly type: GetTransactionType<envelope> }
          : never
        : never
  >

  type ErrorType =
    | assertTransactionEnvelope.ErrorType
    | deserializeTransactionEnvelope.ErrorType
    | getTransactionType.ErrorType
    | GlobalErrorType
}

toTransactionEnvelope.parseError = (error: unknown) =>
  error as toTransactionEnvelope.ErrorType

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
export function toTransactionEnvelopeLegacy<
  const envelope extends
    | UnionPartialBy<TransactionEnvelopeLegacy, 'type'>
    | TransactionEnvelopeSerializedLegacy,
>(envelope: envelope): toTransactionEnvelopeLegacy.ReturnType<envelope> {
  if (typeof envelope === 'string')
    return deserializeTransactionEnvelopeLegacy(envelope) as never

  assertTransactionEnvelopeLegacy(envelope)
  return { ...envelope, type: 'legacy' } as never
}

export declare namespace toTransactionEnvelopeLegacy {
  type ReturnType<
    envelope extends
      | UnionPartialBy<TransactionEnvelopeLegacy, 'type'>
      | TransactionEnvelopeSerializedLegacy =
      | UnionPartialBy<TransactionEnvelopeLegacy, 'type'>
      | TransactionEnvelopeSerializedLegacy,
  > = Compute<
    envelope extends TransactionEnvelopeSerializedLegacy
      ? TransactionEnvelopeLegacy
      : envelope & { readonly type: 'legacy' }
  >

  type ErrorType = GlobalErrorType
}

toTransactionEnvelopeLegacy.parseError = (error: unknown) =>
  error as toTransactionEnvelopeLegacy.ErrorType

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
export function toTransactionEnvelopeEip1559<
  const envelope extends
    | UnionPartialBy<TransactionEnvelopeEip1559, 'type'>
    | TransactionEnvelopeSerializedEip1559,
>(envelope: envelope): toTransactionEnvelopeEip1559.ReturnType<envelope> {
  if (typeof envelope === 'string')
    return deserializeTransactionEnvelopeEip1559(envelope) as never

  assertTransactionEnvelopeEip1559(envelope)
  return { ...envelope, type: 'eip1559' } as never
}

export declare namespace toTransactionEnvelopeEip1559 {
  type ReturnType<
    envelope extends
      | UnionPartialBy<TransactionEnvelopeEip1559, 'type'>
      | TransactionEnvelopeSerializedEip1559 =
      | UnionPartialBy<TransactionEnvelopeEip1559, 'type'>
      | TransactionEnvelopeSerializedEip1559,
  > = Compute<
    envelope extends TransactionEnvelopeSerializedEip1559
      ? TransactionEnvelopeEip1559
      : envelope & { readonly type: 'eip1559' }
  >

  type ErrorType = GlobalErrorType
}

toTransactionEnvelopeEip1559.parseError = (error: unknown) =>
  error as toTransactionEnvelopeEip1559.ErrorType

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
export function toTransactionEnvelopeEip2930<
  const envelope extends
    | UnionPartialBy<TransactionEnvelopeEip2930, 'type'>
    | TransactionEnvelopeSerializedEip2930,
>(envelope: envelope): toTransactionEnvelopeEip2930.ReturnType<envelope> {
  if (typeof envelope === 'string')
    return deserializeTransactionEnvelopeEip2930(envelope) as never

  assertTransactionEnvelopeEip2930(envelope)
  return { ...envelope, type: 'eip2930' } as never
}

export declare namespace toTransactionEnvelopeEip2930 {
  type ReturnType<
    envelope extends
      | UnionPartialBy<TransactionEnvelopeEip2930, 'type'>
      | TransactionEnvelopeSerializedEip2930 =
      | UnionPartialBy<TransactionEnvelopeEip2930, 'type'>
      | TransactionEnvelopeSerializedEip2930,
  > = Compute<
    envelope extends TransactionEnvelopeSerializedEip2930
      ? TransactionEnvelopeEip2930
      : envelope & { readonly type: 'eip2930' }
  >

  type ErrorType = GlobalErrorType
}

toTransactionEnvelopeEip2930.parseError = (error: unknown) =>
  error as toTransactionEnvelopeEip2930.ErrorType

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
export function toTransactionEnvelopeEip4844<
  const envelope extends UnionPartialBy<TransactionEnvelopeEip4844, 'type'>,
>(envelope: envelope): toTransactionEnvelopeEip4844.ReturnType<envelope> {
  // TODO:
  // if (typeof envelope === 'string')
  //   return deserializeTransactionEnvelopeEip4844(envelope) as never

  assertTransactionEnvelopeEip4844(envelope)
  return { ...envelope, type: 'eip4844' } as never
}

export declare namespace toTransactionEnvelopeEip4844 {
  type ReturnType<
    envelope extends UnionPartialBy<TransactionEnvelopeEip4844, 'type'>,
  > = Compute<envelope & { readonly type: 'eip4844' }>

  type ErrorType = GlobalErrorType
}

toTransactionEnvelopeEip4844.parseError = (error: unknown) =>
  error as toTransactionEnvelopeEip4844.ErrorType

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
export function toTransactionEnvelopeEip7702<
  const envelope extends UnionPartialBy<TransactionEnvelopeEip7702, 'type'>,
>(envelope: envelope): toTransactionEnvelopeEip7702.ReturnType<envelope> {
  // TODO:
  // if (typeof envelope === 'string')
  //   return deserializeTransactionEnvelopeEip7702(envelope) as never

  assertTransactionEnvelopeEip7702(envelope)
  return { ...envelope, type: 'eip7702' } as never
}

export declare namespace toTransactionEnvelopeEip7702 {
  type ReturnType<
    envelope extends UnionPartialBy<TransactionEnvelopeEip7702, 'type'>,
  > = Compute<envelope & { readonly type: 'eip7702' }>

  type ErrorType = GlobalErrorType
}

toTransactionEnvelopeEip7702.parseError = (error: unknown) =>
  error as toTransactionEnvelopeEip7702.ErrorType
