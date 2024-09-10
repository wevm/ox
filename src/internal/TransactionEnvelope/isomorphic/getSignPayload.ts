import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeEip1559_getSignPayload } from '../eip1559/getSignPayload.js'
import { TransactionEnvelopeEip2930_getSignPayload } from '../eip2930/getSignPayload.js'
import { TransactionEnvelopeEip4844_getSignPayload } from '../eip4844/getSignPayload.js'
import { TransactionEnvelopeEip7702_getSignPayload } from '../eip7702/getSignPayload.js'
import { TransactionEnvelope_TypeNotImplementedError } from '../errors.js'
import { TransactionEnvelopeLegacy_getSignPayload } from '../legacy/getSignPayload.js'
import type { TransactionEnvelope } from './types.js'

/**
 * Returns the payload to sign for a {@link ox#TransactionEnvelope.TransactionEnvelope}.
 *
 * @example
 * The example below demonstrates how to compute the sign payload which can be used
 * with ECDSA signing utilities like {@link ox#Secp256k1.sign}.
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
 * ```
 *
 * @param envelope - The transaction envelope to get the sign payload for.
 * @returns The sign payload.
 */
export function TransactionEnvelope_getSignPayload(
  envelope: TransactionEnvelope,
): TransactionEnvelope_getSignPayload.ReturnType {
  if (envelope.type === 'legacy')
    return TransactionEnvelopeLegacy_getSignPayload(envelope)
  if (envelope.type === 'eip2930')
    return TransactionEnvelopeEip2930_getSignPayload(envelope)
  if (envelope.type === 'eip1559')
    return TransactionEnvelopeEip1559_getSignPayload(envelope)
  if (envelope.type === 'eip4844')
    return TransactionEnvelopeEip4844_getSignPayload(envelope)
  if (envelope.type === 'eip7702')
    return TransactionEnvelopeEip7702_getSignPayload(envelope)

  throw new TransactionEnvelope_TypeNotImplementedError({
    type: (envelope as any).type,
  })
}

export declare namespace TransactionEnvelope_getSignPayload {
  type ReturnType = Hex

  type ErrorType =
    | TransactionEnvelopeLegacy_getSignPayload.ErrorType
    | TransactionEnvelopeEip1559_getSignPayload.ErrorType
    | TransactionEnvelopeEip2930_getSignPayload.ErrorType
    | TransactionEnvelopeEip4844_getSignPayload.ErrorType
    | TransactionEnvelopeEip7702_getSignPayload.ErrorType
    | GlobalErrorType
}

TransactionEnvelope_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_getSignPayload.ErrorType
