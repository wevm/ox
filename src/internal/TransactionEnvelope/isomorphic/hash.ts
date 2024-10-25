import type * as Errors from '../../../Errors.js'
import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import type { Hex } from '../../Hex/types.js'
import type { OneOf } from '../../types.js'

/**
 * Hashes a {@link ox#TransactionEnvelope.TransactionEnvelope}. This is the "transaction hash".
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1, TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   nonce: 0n,
 *   gasPrice: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 *   data: '0x',
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelope.getSignPayload(envelope),
 *   privateKey: '0x...'
 * })
 *
 * const envelope_signed = TransactionEnvelope.from(envelope, { signature })
 *
 * const hash = TransactionEnvelope.hash(envelope_signed) // [!code focus]
 * ```
 *
 * @param envelope - The Transaction Envelope to hash.
 * @param options -
 * @returns The hash of the transaction envelope.
 */
export function hash(
  envelope: TransactionEnvelope.TransactionEnvelope,
  options: hash.Options = {},
): hash.ReturnType {
  const envelope_ = envelope as any
  if (envelope_.type === 'legacy')
    return TransactionEnvelopeLegacy.hash(envelope_, options)
  if (envelope_.type === 'eip2930')
    return TransactionEnvelopeEip2930.hash(envelope_, options)
  if (envelope_.type === 'eip1559')
    return TransactionEnvelopeEip1559.hash(envelope_, options)
  if (envelope_.type === 'eip4844')
    return TransactionEnvelopeEip4844.hash(envelope_, options)
  if (envelope_.type === 'eip7702')
    return TransactionEnvelopeEip7702.hash(envelope_, options)

  throw new TransactionEnvelope.TypeNotImplementedError({
    type: envelope_.type,
  })
}

export declare namespace hash {
  type Options = OneOf<
    | TransactionEnvelopeLegacy.hash.Options
    | TransactionEnvelopeEip1559.hash.Options
    | TransactionEnvelopeEip2930.hash.Options
    | TransactionEnvelopeEip4844.hash.Options
    | TransactionEnvelopeEip7702.hash.Options
  >

  type ReturnType = Hex

  type ErrorType =
    | TransactionEnvelopeLegacy.hash.ErrorType
    | TransactionEnvelopeEip1559.hash.ErrorType
    | TransactionEnvelopeEip2930.hash.ErrorType
    | TransactionEnvelopeEip4844.hash.ErrorType
    | TransactionEnvelopeEip7702.hash.ErrorType
    | Errors.GlobalErrorType
}

hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as hash.ErrorType
