import type { GlobalErrorType } from '../../errors/error.js'
import type { Hex } from '../../hex/types.js'
import { Signature_from } from '../../signature/from.js'
import type { Signature } from '../../signature/types.js'
import type { Assign, Compute, UnionPartialBy } from '../../types.js'
import type { TransactionEnvelope } from '../types.js'
import { TransactionEnvelopeEip1559_assert } from './assert.js'
import { TransactionEnvelopeEip1559_deserialize } from './deserialize.js'
import type {
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip1559_Serialized,
} from './types.js'

/**
 * Converts an arbitrary transaction object into an EIP-1559 Transaction Envelope.
 *
 * @example
 * ```ts
 * import { TransactionEnvelopeEip1559, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip1559.from({
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * ```
 */
export function TransactionEnvelopeEip1559_from<
  const envelope extends
    | UnionPartialBy<TransactionEnvelopeEip1559, 'type'>
    | TransactionEnvelopeEip1559_Serialized,
  const signature extends Signature | undefined = undefined,
>(
  envelope_: envelope,
  options: TransactionEnvelopeEip1559_from.Options<signature> = {},
): TransactionEnvelopeEip1559_from.ReturnType<envelope, signature> {
  const { signature } = options

  const envelope = (
    typeof envelope_ === 'string'
      ? TransactionEnvelopeEip1559_deserialize(envelope_)
      : envelope_
  ) as TransactionEnvelopeEip1559

  TransactionEnvelopeEip1559_assert(envelope)

  return {
    ...envelope,
    ...(signature ? Signature_from(signature) : {}),
    type: 'eip1559',
  } as never
}

export declare namespace TransactionEnvelopeEip1559_from {
  type Options<signature extends Signature | undefined = undefined> = {
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    envelope extends UnionPartialBy<TransactionEnvelope, 'type'> | Hex =
      | TransactionEnvelopeEip1559
      | Hex,
    signature extends Signature | undefined = undefined,
  > = Compute<
    envelope extends Hex
      ? TransactionEnvelopeEip1559
      : Assign<
          envelope,
          (signature extends Signature ? Readonly<signature> : {}) & {
            readonly type: 'eip1559'
          }
        >
  >

  type ErrorType =
    | TransactionEnvelopeEip1559_deserialize.ErrorType
    | TransactionEnvelopeEip1559_assert.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip1559_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip1559_from.ErrorType
