import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'

/**
 * Returns the payload to sign for a {@link ox#TransactionEnvelope.TransactionEnvelope}.
 *
 * @example
 * The example below demonstrates how to compute the sign payload which can be used
 * with ECDSA signing utilities like {@link ox#Secp256k1.(sign:function)}.
 *
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
 * })
 *
 * const payload = TransactionEnvelope.getSignPayload(envelope) // [!code focus]
 * // @log: '0x...'
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 *
 * const envelope_signed = TransactionEnvelope.from(envelope, { signature })
 * ```
 *
 * @param envelope - The transaction envelope to get the sign payload for.
 * @returns The sign payload.
 */
export function getSignPayload(
  envelope: TransactionEnvelope.TransactionEnvelope,
): getSignPayload.ReturnType {
  if (envelope.type === 'legacy')
    return TransactionEnvelopeLegacy.getSignPayload(envelope)
  if (envelope.type === 'eip2930')
    return TransactionEnvelopeEip2930.getSignPayload(envelope)
  if (envelope.type === 'eip1559')
    return TransactionEnvelopeEip1559.getSignPayload(envelope)
  if (envelope.type === 'eip4844')
    return TransactionEnvelopeEip4844.getSignPayload(envelope)
  if (envelope.type === 'eip7702')
    return TransactionEnvelopeEip7702.getSignPayload(envelope)

  throw new TransactionEnvelope.TypeNotImplementedError({
    type: (envelope as any).type,
  })
}

export declare namespace getSignPayload {
  type ReturnType = Hex

  type ErrorType =
    | TransactionEnvelopeLegacy.getSignPayload.ErrorType
    | TransactionEnvelopeEip1559.getSignPayload.ErrorType
    | TransactionEnvelopeEip2930.getSignPayload.ErrorType
    | TransactionEnvelopeEip4844.getSignPayload.ErrorType
    | TransactionEnvelopeEip7702.getSignPayload.ErrorType
    | GlobalErrorType
}

getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as getSignPayload.ErrorType
