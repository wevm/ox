import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'
import type { Compute, IsNarrowable } from '../../types.js'
import { type GetType, getType } from './getType.js'

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
export function deserialize<
  const serialized extends TransactionEnvelope.Serialized,
>(serialized: serialized): deserialize.ReturnType<serialized> {
  const type = getType(serialized)

  if (type === 'legacy')
    return TransactionEnvelopeLegacy.deserialize(serialized as any) as never
  if (type === 'eip2930')
    return TransactionEnvelopeEip2930.deserialize(serialized as any) as never
  if (type === 'eip1559')
    return TransactionEnvelopeEip1559.deserialize(serialized as any) as never
  if (type === 'eip4844')
    return TransactionEnvelopeEip4844.deserialize(serialized as any) as never
  if (type === 'eip7702')
    return TransactionEnvelopeEip7702.deserialize(serialized as any) as never

  throw new TransactionEnvelope.TypeNotImplementedError({ type })
}

export declare namespace deserialize {
  type ReturnType<
    serialized extends
      TransactionEnvelope.Serialized = TransactionEnvelope.Serialized,
    type extends TransactionEnvelope.Type = GetType<serialized>,
  > = Compute<
    IsNarrowable<serialized, Hex> extends true
      ?
          | (type extends 'eip1559'
              ? TransactionEnvelopeEip1559.TransactionEnvelope
              : never)
          | (type extends 'eip2930'
              ? TransactionEnvelopeEip2930.TransactionEnvelope
              : never)
          | (type extends 'eip4844'
              ? TransactionEnvelopeEip4844.TransactionEnvelope
              : never)
          | (type extends 'eip7702'
              ? TransactionEnvelopeEip7702.TransactionEnvelope
              : never)
          | (type extends 'legacy'
              ? TransactionEnvelopeLegacy.TransactionEnvelope
              : never)
      : TransactionEnvelope.TransactionEnvelope
  >

  type ErrorType =
    | getType.ErrorType
    | TransactionEnvelopeLegacy.deserialize.ErrorType
    | TransactionEnvelopeEip2930.deserialize.ErrorType
    | TransactionEnvelopeEip1559.deserialize.ErrorType
    | TransactionEnvelopeEip4844.deserialize.ErrorType
    | TransactionEnvelopeEip7702.deserialize.ErrorType
    | GlobalErrorType
}

deserialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as deserialize.ErrorType
