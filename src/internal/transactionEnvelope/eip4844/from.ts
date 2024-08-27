import type { GlobalErrorType } from '../../errors/error.js'
import type { Hex } from '../../hex/types.js'
import { Signature_from } from '../../signature/from.js'
import type { Signature } from '../../signature/types.js'
import type { Assign, Compute, UnionPartialBy } from '../../types.js'
import type { TransactionEnvelope } from '../isomorphic/types.js'
import { TransactionEnvelopeEip4844_assert } from './assert.js'
import { TransactionEnvelopeEip4844_deserialize } from './deserialize.js'
import type {
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip4844_Serialized,
} from './types.js'

/**
 * Converts an arbitrary transaction object into an EIP-4844 Transaction Envelope.
 *
 * @example
 * ```ts
 * import { TransactionEnvelopeEip4844, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip4844.from({
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
export function TransactionEnvelopeEip4844_from<
  const envelope extends
    | UnionPartialBy<TransactionEnvelopeEip4844, 'type'>
    | TransactionEnvelopeEip4844_Serialized,
  const signature extends Signature | undefined = undefined,
>(
  envelope_:
    | envelope
    | UnionPartialBy<TransactionEnvelopeEip4844, 'type'>
    | TransactionEnvelopeEip4844_Serialized,
  options: TransactionEnvelopeEip4844_from.Options<signature> = {},
): TransactionEnvelopeEip4844_from.ReturnType<envelope, signature> {
  const { signature } = options

  const envelope = (
    typeof envelope_ === 'string'
      ? TransactionEnvelopeEip4844_deserialize(envelope_)
      : envelope_
  ) as TransactionEnvelopeEip4844

  TransactionEnvelopeEip4844_assert(envelope)

  return {
    ...envelope,
    ...(signature ? Signature_from(signature) : {}),
    type: 'eip4844',
  } as never
}

export declare namespace TransactionEnvelopeEip4844_from {
  type Options<signature extends Signature | undefined = undefined> = {
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    envelope extends UnionPartialBy<TransactionEnvelope, 'type'> | Hex =
      | TransactionEnvelopeEip4844
      | Hex,
    signature extends Signature | undefined = undefined,
  > = Compute<
    envelope extends Hex
      ? TransactionEnvelopeEip4844
      : Assign<
          envelope,
          (signature extends Signature ? Readonly<signature> : {}) & {
            readonly type: 'eip4844'
          }
        >
  >

  type ErrorType =
    | TransactionEnvelopeEip4844_deserialize.ErrorType
    | TransactionEnvelopeEip4844_assert.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip4844_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip4844_from.ErrorType
