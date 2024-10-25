import type * as Errors from '../../../Errors.js'
import type * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import type { Hex } from '../../Hex/types.js'
import { Signature_from } from '../../Signature/from.js'
import type { Signature } from '../../Signature/types.js'
import type { Assign, Compute, UnionPartialBy } from '../../types.js'

/**
 * Converts an arbitrary transaction object into an EIP-2930 Transaction Envelope.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { TransactionEnvelopeEip2930, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip2930.from({
 *   chainId: 1,
 *   accessList: [...],
 *   gasPrice: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the transaction envelope.
 *
 * ```ts twoslash
 * import { Secp256k1, TransactionEnvelopeEip2930, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip2930.from({
 *   chainId: 1,
 *   gasPrice: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelopeEip2930.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const envelope_signed = TransactionEnvelopeEip2930.from(envelope, { // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   chainId: 1,
 * // @log:   gasPrice: 10000000000n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'eip2930',
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
 * It is possible to instantiate an EIP-2930 Transaction Envelope from a {@link ox#TransactionEnvelope.Serialized} value.
 *
 * ```ts twoslash
 * import { TransactionEnvelopeEip2930 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip2930.from('0x01f858018203118502540be4008504a817c800809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c08477359400e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261')
 * // @log: {
 * // @log:   chainId: 1,
 * // @log:   gasPrice: 10000000000n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'eip2930',
 * // @log:   value: 1000000000000000000n,
 * // @log: }
 * ```
 *
 * @param envelope - The transaction object to convert.
 * @param options -
 * @returns A {@link ox#TransactionEnvelopeEip2930.TransactionEnvelope}
 */
export function from<
  const envelope extends
    | UnionPartialBy<TransactionEnvelopeEip2930.TransactionEnvelope, 'type'>
    | TransactionEnvelopeEip2930.Serialized,
  const signature extends Signature | undefined = undefined,
>(
  envelope:
    | envelope
    | UnionPartialBy<TransactionEnvelopeEip2930.TransactionEnvelope, 'type'>
    | TransactionEnvelopeEip2930.Serialized,
  options: from.Options<signature> = {},
): from.ReturnType<envelope, signature> {
  const { signature } = options

  const envelope_ = (
    typeof envelope === 'string'
      ? TransactionEnvelopeEip2930.deserialize(envelope)
      : envelope
  ) as TransactionEnvelopeEip2930.TransactionEnvelope

  TransactionEnvelopeEip2930.assert(envelope_)

  return {
    ...envelope_,
    ...(signature ? Signature_from(signature) : {}),
    type: 'eip2930',
  } as never
}

export declare namespace from {
  type Options<signature extends Signature | undefined = undefined> = {
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    envelope extends
      | UnionPartialBy<TransactionEnvelope.TransactionEnvelope, 'type'>
      | Hex = TransactionEnvelopeEip2930.TransactionEnvelope | Hex,
    signature extends Signature | undefined = undefined,
  > = Compute<
    envelope extends Hex
      ? TransactionEnvelopeEip2930.TransactionEnvelope
      : Assign<
          envelope,
          (signature extends Signature ? Readonly<signature> : {}) & {
            readonly type: 'eip2930'
          }
        >
  >

  type ErrorType =
    | TransactionEnvelopeEip2930.deserialize.ErrorType
    | TransactionEnvelopeEip2930.assert.ErrorType
    | Errors.GlobalErrorType
}

from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as from.ErrorType
