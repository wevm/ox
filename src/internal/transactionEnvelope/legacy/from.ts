import type { GlobalErrorType } from '../../errors/error.js'
import type { Hex } from '../../hex/types.js'
import { Signature_from } from '../../signature/from.js'
import type { Signature } from '../../signature/types.js'
import type { Assign, Compute, UnionPartialBy } from '../../types.js'
import type { TransactionEnvelope } from '../isomorphic/types.js'
import { TransactionEnvelopeLegacy_assert } from './assert.js'
import { TransactionEnvelopeLegacy_deserialize } from './deserialize.js'
import type { TransactionEnvelopeLegacy } from './types.js'

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
export function TransactionEnvelopeLegacy_from<
  const envelope extends
    | UnionPartialBy<TransactionEnvelopeLegacy, 'type'>
    | Hex,
  const signature extends Signature | undefined = undefined,
>(
  envelope_: envelope | UnionPartialBy<TransactionEnvelopeLegacy, 'type'> | Hex,
  options: TransactionEnvelopeLegacy_from.Options<signature> = {},
): TransactionEnvelopeLegacy_from.ReturnType<envelope, signature> {
  const { signature } = options

  const envelope = (
    typeof envelope_ === 'string'
      ? TransactionEnvelopeLegacy_deserialize(envelope_)
      : envelope_
  ) as TransactionEnvelopeLegacy

  TransactionEnvelopeLegacy_assert(envelope)

  const signature_ = (() => {
    if (!signature) return {}
    const s = Signature_from(signature) as any
    s.v = s.yParity === 0 ? 27 : 28
    delete s.yParity
    return s
  })()

  return {
    ...envelope,
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
            ? Readonly<{
                r: signature['r']
                s: signature['s']
                v: signature['yParity'] extends 0 ? 27 : 28
              }>
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
