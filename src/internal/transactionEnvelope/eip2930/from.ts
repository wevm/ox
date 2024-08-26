import type { GlobalErrorType } from '../../errors/error.js'
import type { Hex } from '../../hex/types.js'
import { Signature_from } from '../../signature/from.js'
import type { Signature } from '../../signature/types.js'
import type { Assign, Compute, UnionPartialBy } from '../../types.js'
import type { TransactionEnvelope } from '../types.js'
import { TransactionEnvelopeEip2930_assert } from './assert.js'
import { TransactionEnvelopeEip2930_deserialize } from './deserialize.js'
import type {
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip2930_Serialized,
} from './types.js'

/**
 * Converts an arbitrary transaction object into an EIP-2930 Transaction Envelope.
 *
 * @example
 * ```ts
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
 */
export function TransactionEnvelopeEip2930_from<
  const envelope extends
    | UnionPartialBy<TransactionEnvelopeEip2930, 'type'>
    | TransactionEnvelopeEip2930_Serialized,
  const signature extends Signature | undefined = undefined,
>(
  envelope_: envelope,
  options: TransactionEnvelopeEip2930_from.Options<signature> = {},
): TransactionEnvelopeEip2930_from.ReturnType<envelope, signature> {
  const { signature } = options

  const envelope = (
    typeof envelope_ === 'string'
      ? TransactionEnvelopeEip2930_deserialize(envelope_)
      : envelope_
  ) as TransactionEnvelopeEip2930

  TransactionEnvelopeEip2930_assert(envelope)

  return {
    ...envelope,
    ...(signature ? Signature_from(signature) : {}),
    type: 'eip2930',
  } as never
}

export declare namespace TransactionEnvelopeEip2930_from {
  type Options<signature extends Signature | undefined = undefined> = {
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    envelope extends UnionPartialBy<TransactionEnvelope, 'type'> | Hex =
      | TransactionEnvelopeEip2930
      | Hex,
    signature extends Signature | undefined = undefined,
  > = Compute<
    envelope extends Hex
      ? TransactionEnvelopeEip2930
      : Assign<
          envelope,
          (signature extends Signature ? Readonly<signature> : {}) & {
            readonly type: 'eip2930'
          }
        >
  >

  type ErrorType =
    | TransactionEnvelopeEip2930_deserialize.ErrorType
    | TransactionEnvelopeEip2930_assert.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip2930_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip2930_from.ErrorType
