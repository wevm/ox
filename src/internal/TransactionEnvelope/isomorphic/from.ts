import type { GlobalErrorType } from '../../Errors/error.js'
import type { Signature } from '../../Signature/types.js'
import type { UnionCompute, UnionPartialBy } from '../../types.js'
import { TransactionEnvelopeEip1559_from } from '../eip1559/from.js'
import { TransactionEnvelopeEip2930_from } from '../eip2930/from.js'
import { TransactionEnvelopeEip4844_from } from '../eip4844/from.js'
import { TransactionEnvelopeEip7702_from } from '../eip7702/from.js'
import { TransactionEnvelope_TypeNotImplementedError } from '../errors.js'
import { TransactionEnvelopeLegacy_from } from '../legacy/from.js'
import type { TransactionEnvelope_deserialize } from './deserialize.js'
import {
  type TransactionEnvelope_GetType,
  TransactionEnvelope_getType,
} from './getType.js'
import type {
  TransactionEnvelope,
  TransactionEnvelope_Serialized,
} from './types.js'

/**
 * Converts an arbitrary transaction object into a typed {@link ox#TransactionEnvelope.TransactionEnvelope}.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope, Value } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * // @log: {
 * // @log:   chainId: 1,
 * // @log:   maxFeePerGas: 10000000000n,
 * // @log:   maxPriorityFeePerGas: 1000000000n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'eip1559',
 * // @log:   value: 1000000000000000000n,
 * // @log: }
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the transaction envelope.
 *
 * ```ts twoslash
 * import { Secp256k1, TransactionEnvelope, Value } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelope.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const envelope_signed = TransactionEnvelope.from(envelope, { // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   chainId: 1,
 * // @log:   maxFeePerGas: 10000000000n,
 * // @log:   maxPriorityFeePerGas: 1000000000n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'eip1559',
 * // @log:   value: 1000000000000000000n,
 * // @log:   r: 125...n,
 * // @log:   s: 642...n,
 * // @log:   yParity: 0,
 * // @log: }
 * ```
 *
 * @example
 * ### From Serialized
 *
 * It is possible to instantiate a Transaction Envelope from a {@link ox#TransactionEnvelope.Serialized} value.
 *
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.from('0x02f858018203118502540be4008504a817c800809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c08477359400e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261')
 * // @log: {
 * // @log:   chainId: 1,
 * // @log:   maxFeePerGas: 10000000000n,
 * // @log:   maxPriorityFeePerGas: 1000000000n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'eip1559',
 * // @log:   value: 1000000000000000000n,
 * // @log: }
 * ```
 *
 *
 * @param value - The arbitrary value to instantiate a {@link ox#TransactionEnvelope.TransactionEnvelope} from.
 * @param options - Options.
 * @returns A {@link ox#TransactionEnvelope.TransactionEnvelope}.
 */
export function TransactionEnvelope_from<
  const value extends
    | UnionPartialBy<TransactionEnvelope, 'type'>
    | TransactionEnvelope_Serialized,
  const signature extends Signature | undefined = undefined,
>(
  value:
    | value
    | UnionPartialBy<TransactionEnvelope, 'type'>
    | TransactionEnvelope_Serialized,
  options: TransactionEnvelope_from.Options<signature> = {},
): TransactionEnvelope_from.ReturnType<value, signature> {
  const type = TransactionEnvelope_getType(value)

  if (type === 'legacy')
    return TransactionEnvelopeLegacy_from(value as any, options) as never
  if (type === 'eip2930')
    return TransactionEnvelopeEip2930_from(value as any, options) as never
  if (type === 'eip1559')
    return TransactionEnvelopeEip1559_from(value as any, options) as never
  if (type === 'eip4844')
    return TransactionEnvelopeEip4844_from(value as any, options) as never
  if (type === 'eip7702')
    return TransactionEnvelopeEip7702_from(value as any, options) as never

  throw new TransactionEnvelope_TypeNotImplementedError({ type })
}

export declare namespace TransactionEnvelope_from {
  type Options<signature extends Signature | undefined = undefined> = {
    /** Signature to attach to the Transaction Envelope. */
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    value extends
      | UnionPartialBy<TransactionEnvelope, 'type'>
      | TransactionEnvelope_Serialized =
      | UnionPartialBy<TransactionEnvelope, 'type'>
      | TransactionEnvelope_Serialized,
    signature extends Signature | undefined = undefined,
  > = UnionCompute<
    | (TransactionEnvelope_GetType<value> extends 'legacy'
        ? TransactionEnvelopeLegacy_from.ReturnType<value, signature>
        : never)
    | (TransactionEnvelope_GetType<value> extends 'eip1559'
        ? TransactionEnvelopeEip1559_from.ReturnType<value, signature>
        : never)
    | (TransactionEnvelope_GetType<value> extends 'eip2930'
        ? TransactionEnvelopeEip2930_from.ReturnType<value, signature>
        : never)
    | (TransactionEnvelope_GetType<value> extends 'eip4844'
        ? TransactionEnvelopeEip4844_from.ReturnType<value, signature>
        : never)
    | (TransactionEnvelope_GetType<value> extends 'eip7702'
        ? TransactionEnvelopeEip7702_from.ReturnType<value, signature>
        : never)
  >

  type ErrorType =
    | TransactionEnvelope_deserialize.ErrorType
    | TransactionEnvelope_getType.ErrorType
    | GlobalErrorType
}

TransactionEnvelope_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_from.ErrorType
