import * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'
import { Signature_from } from '../../Signature/from.js'
import type { Signature } from '../../Signature/types.js'
import type { Assign, Compute, UnionPartialBy } from '../../types.js'
import type { TransactionEnvelope } from '../isomorphic/types.js'

/**
 * Converts an arbitrary transaction object into an EIP-7702 Transaction Envelope.
 *
 * @example
 * ```ts twoslash
 * import { Authorization, Secp256k1, TransactionEnvelopeEip7702, Value } from 'ox'
 *
 * const authorization = Authorization.from({
 *   address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   chainId: 1,
 *   nonce: 0n,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: Authorization.getSignPayload(authorization),
 *   privateKey: '0x...',
 * })
 *
 * const authorizationList = [Authorization.from(authorization, { signature })]
 *
 * const envelope = TransactionEnvelopeEip7702.from({ // [!code focus]
 *   authorizationList, // [!code focus]
 *   chainId: 1, // [!code focus]
 *   maxFeePerGas: Value.fromGwei('10'), // [!code focus]
 *   maxPriorityFeePerGas: Value.fromGwei('1'), // [!code focus]
 *   to: '0x0000000000000000000000000000000000000000', // [!code focus]
 *   value: Value.fromEther('1'), // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the transaction envelope.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1, TransactionEnvelopeEip7702, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip7702.from({
 *   authorizationList: [...],
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelopeEip7702.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const envelope_signed = TransactionEnvelopeEip7702.from(envelope, { // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   authorizationList: [...],
 * // @log:   chainId: 1,
 * // @log:   maxFeePerGas: 10000000000n,
 * // @log:   maxPriorityFeePerGas: 1000000000n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'eip7702',
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
 * It is possible to instantiate an EIP-7702 Transaction Envelope from a {@link ox#TransactionEnvelope.Serialized} value.
 *
 * ```ts twoslash
 * import { TransactionEnvelopeEip7702 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip7702.from('0x04f858018203118502540be4008504a817c800809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c08477359400e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261')
 * // @log: {
 * // @log:   authorizationList: [...],
 * // @log:   chainId: 1,
 * // @log:   maxFeePerGas: 10000000000n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'eip7702',
 * // @log:   value: 1000000000000000000n,
 * // @log: }
 * ```
 *
 * @param envelope - The transaction object to convert.
 * @param options -
 * @returns An EIP-7702 Transaction Envelope.
 */
export function from<
  const envelope extends
    | UnionPartialBy<TransactionEnvelopeEip7702.TransactionEnvelope, 'type'>
    | TransactionEnvelopeEip7702.Serialized,
  const signature extends Signature | undefined = undefined,
>(
  envelope:
    | envelope
    | UnionPartialBy<TransactionEnvelopeEip7702.TransactionEnvelope, 'type'>
    | TransactionEnvelopeEip7702.Serialized,
  options: from.Options<signature> = {},
): from.ReturnType<envelope, signature> {
  const { signature } = options

  const envelope_ = (
    typeof envelope === 'string'
      ? TransactionEnvelopeEip7702.deserialize(envelope)
      : envelope
  ) as TransactionEnvelopeEip7702.TransactionEnvelope

  TransactionEnvelopeEip7702.assert(envelope_)

  return {
    ...envelope_,
    ...(signature ? Signature_from(signature) : {}),
    type: 'eip7702',
  } as never
}

export declare namespace from {
  type Options<signature extends Signature | undefined = undefined> = {
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    envelope extends UnionPartialBy<TransactionEnvelope, 'type'> | Hex =
      | TransactionEnvelopeEip7702.TransactionEnvelope
      | Hex,
    signature extends Signature | undefined = undefined,
  > = Compute<
    envelope extends Hex
      ? TransactionEnvelopeEip7702.TransactionEnvelope
      : Assign<
          envelope,
          (signature extends Signature ? Readonly<signature> : {}) & {
            readonly type: 'eip7702'
          }
        >
  >

  type ErrorType =
    | TransactionEnvelopeEip7702.deserialize.ErrorType
    | TransactionEnvelopeEip7702.assert.ErrorType
    | GlobalErrorType
}

from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as from.ErrorType
