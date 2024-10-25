import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'
import { Signature_from } from '../../Signature/from.js'
import type { Signature } from '../../Signature/types.js'
import type { Assign, Compute, UnionPartialBy } from '../../types.js'
import type { TransactionEnvelope } from '../isomorphic/types.js'
import { TransactionEnvelopeLegacy_assert } from './assert.js'
import { TransactionEnvelopeLegacy_deserialize } from './deserialize.js'
import type { TransactionEnvelopeLegacy } from './types.js'

/**
 * Converts an arbitrary transaction object into a legacy Transaction Envelope.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeLegacy, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeLegacy.from({
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
 * import { Secp256k1, TransactionEnvelopeLegacy, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeLegacy.from({
 *   chainId: 1,
 *   gasPrice: Value.fromGwei('10'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelopeLegacy.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const envelope_signed = TransactionEnvelopeLegacy.from(envelope, { // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   authorizationList: [...],
 * // @log:   chainId: 1,
 * // @log:   gasPrice: 10000000000n,
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
 * It is possible to instantiate an legacy Transaction Envelope from a {@link ox#TransactionEnvelope.Serialized} value.
 *
 * ```ts twoslash
 * import { TransactionEnvelopeLegacy } from 'ox'
 *
 * const envelope = TransactionEnvelopeLegacy.from('0xf858018203118502540be4008504a817c800809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c08477359400e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261')
 * // @log: {
 * // @log:   chainId: 1,
 * // @log:   gasPrice: 10000000000n,
 * // @log:   to: '0x0000000000000000000000000000000000000000',
 * // @log:   type: 'legacy',
 * // @log:   value: 1000000000000000000n,
 * // @log: }
 * ```
 *
 * @param envelope - The transaction object to convert.
 * @param options - Options.
 * @returns A legacy Transaction Envelope.
 */
export function TransactionEnvelopeLegacy_from<
  const envelope extends
    | UnionPartialBy<TransactionEnvelopeLegacy, 'type'>
    | Hex,
  const signature extends Signature | undefined = undefined,
>(
  envelope: envelope | UnionPartialBy<TransactionEnvelopeLegacy, 'type'> | Hex,
  options: TransactionEnvelopeLegacy_from.Options<signature> = {},
): TransactionEnvelopeLegacy_from.ReturnType<envelope, signature> {
  const { signature } = options

  const envelope_ = (
    typeof envelope === 'string'
      ? TransactionEnvelopeLegacy_deserialize(envelope)
      : envelope
  ) as TransactionEnvelopeLegacy

  TransactionEnvelopeLegacy_assert(envelope_)

  const signature_ = (() => {
    if (!signature) return {}
    const s = Signature_from(signature) as any
    s.v = s.yParity === 0 ? 27 : 28
    return s
  })()

  return {
    ...envelope_,
    ...signature_,
    type: 'legacy',
  } as never
}

export declare namespace TransactionEnvelopeLegacy_from {
  type Options<signature extends Signature | undefined = undefined> = {
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    envelope extends UnionPartialBy<TransactionEnvelope, 'type'> | Hex =
      | TransactionEnvelopeLegacy
      | Hex,
    signature extends Signature | undefined = undefined,
  > = Compute<
    envelope extends Hex
      ? TransactionEnvelopeLegacy
      : Assign<
          envelope,
          (signature extends Signature
            ? Readonly<
                signature & {
                  v: signature['yParity'] extends 0 ? 27 : 28
                }
              >
            : {}) & {
            readonly type: 'legacy'
          }
        >
  >

  type ErrorType =
    | TransactionEnvelopeLegacy_deserialize.ErrorType
    | TransactionEnvelopeLegacy_assert.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeLegacy_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeLegacy_from.ErrorType
