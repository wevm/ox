import type {
  TransactionEnvelope,
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip7702,
  TransactionEnvelopeLegacy,
} from '../types/transactionEnvelope.js'
import type { PartialBy, UnionPartialBy } from '../types/utils.js'
import { getTransactionType } from './getTransactionType.js'

// TODO: support deserialize

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
  const envelope extends UnionPartialBy<TransactionEnvelope, 'type'>,
>(envelope: envelope): envelope {
  const type = getTransactionType(envelope)
  return { ...envelope, type }
}

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
  const envelope extends PartialBy<TransactionEnvelopeLegacy, 'type'>,
>(envelope: envelope): envelope {
  return envelope
}

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
  const envelope extends PartialBy<TransactionEnvelopeEip1559, 'type'>,
>(envelope: envelope): envelope {
  return envelope
}

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
  const envelope extends PartialBy<TransactionEnvelopeEip2930, 'type'>,
>(envelope: envelope): envelope {
  return envelope
}

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
  const envelope extends PartialBy<TransactionEnvelopeEip4844, 'type'>,
>(envelope: envelope): envelope {
  return envelope
}

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
  const envelope extends PartialBy<TransactionEnvelopeEip7702, 'type'>,
>(envelope: envelope): envelope {
  return envelope
}
