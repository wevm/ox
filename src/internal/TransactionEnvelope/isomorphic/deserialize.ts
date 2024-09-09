import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'
import type { Compute, IsNarrowable } from '../../types.js'
import { TransactionEnvelopeEip1559_deserialize } from '../eip1559/deserialize.js'
import type { TransactionEnvelopeEip1559 } from '../eip1559/types.js'
import { TransactionEnvelopeEip2930_deserialize } from '../eip2930/deserialize.js'
import type { TransactionEnvelopeEip2930 } from '../eip2930/types.js'
import { TransactionEnvelopeEip4844_deserialize } from '../eip4844/deserialize.js'
import type { TransactionEnvelopeEip4844 } from '../eip4844/types.js'
import { TransactionEnvelopeEip7702_deserialize } from '../eip7702/deserialize.js'
import type { TransactionEnvelopeEip7702 } from '../eip7702/types.js'
import { TransactionTypeNotImplementedError } from '../errors.js'
import { TransactionEnvelopeLegacy_deserialize } from '../legacy/deserialize.js'
import type { TransactionEnvelopeLegacy } from '../legacy/types.js'
import {
  type TransactionEnvelope_GetType,
  TransactionEnvelope_getType,
} from './getType.js'
import type {
  TransactionEnvelope,
  TransactionEnvelope_Serialized,
  TransactionEnvelope_Type,
} from './types.js'

/**
 * Deserializes a {@link ox#TransactionEnvelope.TransactionEnvelope} from its serialized form.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.deserialize('0x02ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0')
 * // @log: {
 * // @log:   type: 'eip1559',
 * // @log:   chainId: 1,
 * // @log:   nonce: 785n,
 * // @log:   maxFeePerGas: 2000000000n,
 * // @log:   maxPriorityFeePerGas: 2000000000n,
 * // @log:   gas: 1000000n,
 * // @log:   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 * // @log:   value: 1000000000000000000n,
 * // @log: }
 * ```
 *
 * @param serialized - The serialized Transaction Envelope.
 * @returns Deserialized {@link ox#TransactionEnvelope.TransactionEnvelope}.
 */
export function TransactionEnvelope_deserialize<
  const serialized extends TransactionEnvelope_Serialized,
>(
  serialized: serialized,
): TransactionEnvelope_deserialize.ReturnType<serialized> {
  const type = TransactionEnvelope_getType(serialized)

  if (type === 'legacy')
    return TransactionEnvelopeLegacy_deserialize(serialized as any) as never
  if (type === 'eip2930')
    return TransactionEnvelopeEip2930_deserialize(serialized as any) as never
  if (type === 'eip1559')
    return TransactionEnvelopeEip1559_deserialize(serialized as any) as never
  if (type === 'eip4844')
    return TransactionEnvelopeEip4844_deserialize(serialized as any) as never
  if (type === 'eip7702')
    return TransactionEnvelopeEip7702_deserialize(serialized as any) as never

  throw new TransactionTypeNotImplementedError({ type })
}

export declare namespace TransactionEnvelope_deserialize {
  type ReturnType<
    serialized extends
      TransactionEnvelope_Serialized = TransactionEnvelope_Serialized,
    type extends
      TransactionEnvelope_Type = TransactionEnvelope_GetType<serialized>,
  > = Compute<
    IsNarrowable<serialized, Hex> extends true
      ?
          | (type extends 'eip1559' ? TransactionEnvelopeEip1559 : never)
          | (type extends 'eip2930' ? TransactionEnvelopeEip2930 : never)
          | (type extends 'eip4844' ? TransactionEnvelopeEip4844 : never)
          | (type extends 'eip7702' ? TransactionEnvelopeEip7702 : never)
          | (type extends 'legacy' ? TransactionEnvelopeLegacy : never)
      : TransactionEnvelope
  >

  type ErrorType =
    | TransactionEnvelope_getType.ErrorType
    | TransactionEnvelopeLegacy_deserialize.ErrorType
    | TransactionEnvelopeEip2930_deserialize.ErrorType
    | TransactionEnvelopeEip1559_deserialize.ErrorType
    | TransactionEnvelopeEip4844_deserialize.ErrorType
    | TransactionEnvelopeEip7702_deserialize.ErrorType
    | GlobalErrorType
}

TransactionEnvelope_deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_deserialize.ErrorType
