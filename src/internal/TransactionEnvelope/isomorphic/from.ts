import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { Signature } from '../../Signature/types.js'
import type { UnionCompute, UnionPartialBy } from '../../types.js'
import { type GetType, getType } from './getType.js'

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
 * @param options -
 * @returns A {@link ox#TransactionEnvelope.TransactionEnvelope}.
 */
export function from<
  const value extends
    | UnionPartialBy<TransactionEnvelope.TransactionEnvelope, 'type'>
    | TransactionEnvelope.Serialized,
  const signature extends Signature | undefined = undefined,
>(
  value: value,
  options: from.Options<signature> = {},
): from.ReturnType<value, signature> {
  const type = getType(value)

  if (type === 'legacy')
    return TransactionEnvelopeLegacy.from(value as any, options) as never
  if (type === 'eip2930')
    return TransactionEnvelopeEip2930.from(value as any, options) as never
  if (type === 'eip1559')
    return TransactionEnvelopeEip1559.from(value as any, options) as never
  if (type === 'eip4844')
    return TransactionEnvelopeEip4844.from(value as any, options) as never
  if (type === 'eip7702')
    return TransactionEnvelopeEip7702.from(value as any, options) as never

  throw new TransactionEnvelope.TypeNotImplementedError({ type })
}

export declare namespace from {
  type Options<signature extends Signature | undefined = undefined> = {
    /** Signature to attach to the Transaction Envelope. */
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    value extends
      | UnionPartialBy<TransactionEnvelope.TransactionEnvelope, 'type'>
      | TransactionEnvelope.Serialized =
      | UnionPartialBy<TransactionEnvelope.TransactionEnvelope, 'type'>
      | TransactionEnvelope.Serialized,
    signature extends Signature | undefined = undefined,
  > = UnionCompute<
    | (GetType<value> extends 'legacy'
        ? TransactionEnvelopeLegacy.from.ReturnType<value, signature>
        : never)
    | (GetType<value> extends 'eip1559'
        ? TransactionEnvelopeEip1559.from.ReturnType<value, signature>
        : never)
    | (GetType<value> extends 'eip2930'
        ? TransactionEnvelopeEip2930.from.ReturnType<value, signature>
        : never)
    | (GetType<value> extends 'eip4844'
        ? TransactionEnvelopeEip4844.from.ReturnType<value, signature>
        : never)
    | (GetType<value> extends 'eip7702'
        ? TransactionEnvelopeEip7702.from.ReturnType<value, signature>
        : never)
  >

  type ErrorType =
    | TransactionEnvelope.deserialize.ErrorType
    | getType.ErrorType
    | GlobalErrorType
}

from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as from.ErrorType
