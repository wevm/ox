import type { GlobalErrorType } from '../../errors/error.js'
import type { Signature } from '../../signature/types.js'
import type { UnionCompute, UnionPartialBy } from '../../types.js'
import { TransactionEnvelopeEip1559_from } from '../eip1559/from.js'
import { TransactionEnvelopeEip2930_from } from '../eip2930/from.js'
import { TransactionEnvelopeEip4844_from } from '../eip4844/from.js'
import { TransactionEnvelopeEip7702_from } from '../eip7702/from.js'
import { TransactionTypeNotImplementedError } from '../errors.js'
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
 * Converts an arbitrary transaction object into a typed Transaction Envelope.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope, Value } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * // {
 * //   chainId: 1,
 * //   maxFeePerGas: 10000000000n,
 * //   maxPriorityFeePerGas: 1000000000n,
 * //   to: '0x0000000000000000000000000000000000000000',
 * //   type: 'eip1559',
 * //   value: 1000000000000000000n,
 * // }
 * ```
 */
export function TransactionEnvelope_from<
  const envelope extends
    | UnionPartialBy<TransactionEnvelope, 'type'>
    | TransactionEnvelope_Serialized,
  const signature extends Signature | undefined = undefined,
>(
  envelope: envelope,
  options: TransactionEnvelope_from.Options<signature> = {},
): TransactionEnvelope_from.ReturnType<envelope, signature> {
  const type = TransactionEnvelope_getType(envelope)

  if (type === 'legacy')
    return TransactionEnvelopeLegacy_from(envelope as any, options) as never
  if (type === 'eip2930')
    return TransactionEnvelopeEip2930_from(envelope as any, options) as never
  if (type === 'eip1559')
    return TransactionEnvelopeEip1559_from(envelope as any, options) as never
  if (type === 'eip4844')
    return TransactionEnvelopeEip4844_from(envelope as any, options) as never
  if (type === 'eip7702')
    return TransactionEnvelopeEip7702_from(envelope as any, options) as never

  throw new TransactionTypeNotImplementedError({ type })
}

export declare namespace TransactionEnvelope_from {
  type Options<signature extends Signature | undefined = undefined> = {
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    envelope extends
      | UnionPartialBy<TransactionEnvelope, 'type'>
      | TransactionEnvelope_Serialized =
      | UnionPartialBy<TransactionEnvelope, 'type'>
      | TransactionEnvelope_Serialized,
    signature extends Signature | undefined = undefined,
  > = UnionCompute<
    | (TransactionEnvelope_GetType<envelope> extends 'legacy'
        ? TransactionEnvelopeLegacy_from.ReturnType<envelope, signature>
        : never)
    | (TransactionEnvelope_GetType<envelope> extends 'eip1559'
        ? TransactionEnvelopeEip1559_from.ReturnType<envelope, signature>
        : never)
    | (TransactionEnvelope_GetType<envelope> extends 'eip2930'
        ? TransactionEnvelopeEip2930_from.ReturnType<envelope, signature>
        : never)
    | (TransactionEnvelope_GetType<envelope> extends 'eip4844'
        ? TransactionEnvelopeEip4844_from.ReturnType<envelope, signature>
        : never)
    | (TransactionEnvelope_GetType<envelope> extends 'eip7702'
        ? TransactionEnvelopeEip7702_from.ReturnType<envelope, signature>
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
