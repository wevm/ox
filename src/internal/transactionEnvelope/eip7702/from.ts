import type { GlobalErrorType } from '../../errors/error.js'
import type { Hex } from '../../hex/types.js'
import { Signature_from } from '../../signature/from.js'
import type { Signature } from '../../signature/types.js'
import type { Assign, Compute, UnionPartialBy } from '../../types.js'
import type { TransactionEnvelope } from '../isomorphic/types.js'
import { TransactionEnvelopeEip7702_assert } from './assert.js'
import { TransactionEnvelopeEip7702_deserialize } from './deserialize.js'
import type {
  TransactionEnvelopeEip7702,
  TransactionEnvelopeEip7702_Serialized,
} from './types.js'

/**
 * Converts an arbitrary transaction object into an EIP-7702 Transaction Envelope.
 *
 * @example
 * ```ts
 * import { TransactionEnvelopeEip7702, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip7702.from({
 *   authorizationList: [...],
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * ```
 */
export function TransactionEnvelopeEip7702_from<
  const envelope extends
    | UnionPartialBy<TransactionEnvelopeEip7702, 'type'>
    | TransactionEnvelopeEip7702_Serialized,
  const signature extends Signature | undefined = undefined,
>(
  envelope_:
    | envelope
    | UnionPartialBy<TransactionEnvelopeEip7702, 'type'>
    | TransactionEnvelopeEip7702_Serialized,
  options: TransactionEnvelopeEip7702_from.Options<signature> = {},
): TransactionEnvelopeEip7702_from.ReturnType<envelope, signature> {
  const { signature } = options

  const envelope = (
    typeof envelope_ === 'string'
      ? TransactionEnvelopeEip7702_deserialize(envelope_)
      : envelope_
  ) as TransactionEnvelopeEip7702

  TransactionEnvelopeEip7702_assert(envelope)

  return {
    ...envelope,
    ...(signature ? Signature_from(signature) : {}),
    type: 'eip7702',
  } as never
}

export declare namespace TransactionEnvelopeEip7702_from {
  type Options<signature extends Signature | undefined = undefined> = {
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    envelope extends UnionPartialBy<TransactionEnvelope, 'type'> | Hex =
      | TransactionEnvelopeEip7702
      | Hex,
    signature extends Signature | undefined = undefined,
  > = Compute<
    envelope extends Hex
      ? TransactionEnvelopeEip7702
      : Assign<
          envelope,
          (signature extends Signature ? Readonly<signature> : {}) & {
            readonly type: 'eip7702'
          }
        >
  >

  type ErrorType =
    // | TransactionEnvelopeEip7702_deserialize.ErrorType
    TransactionEnvelopeEip7702_assert.ErrorType | GlobalErrorType
}

TransactionEnvelopeEip7702_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip7702_from.ErrorType
