import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../hex/types.js'
import { TransactionEnvelopeEip1559_getSignPayload } from './eip1559/getSignPayload.js'
import { TransactionEnvelopeEip2930_getSignPayload } from './eip2930/getSignPayload.js'
import { TransactionEnvelopeEip4844_getSignPayload } from './eip4844/getSignPayload.js'
import { TransactionTypeNotImplementedError } from './errors.js'
import { TransactionEnvelopeLegacy_getSignPayload } from './legacy/getSignPayload.js'
import type { TransactionEnvelope } from './types.js'

/**
 * Returns the payload to sign for a {@link TransactionEnvelope#TransactionEnvelope}.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   nonce: 0,
 *   gasPrice: 1000000000n,
 *   gasLimit: 21000,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 *   data: '0x',
 * })
 *
 * const hash = TransactionEnvelope.getSignPayload(envelope)
 * // '0x...'
 * ```
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

  // TODO: EIP-7702

  throw new TransactionTypeNotImplementedError({ type: envelope.type })
}

export declare namespace TransactionEnvelope_getSignPayload {
  type ReturnType = Hex

  type ErrorType =
    | TransactionEnvelopeLegacy_getSignPayload.ErrorType
    | TransactionEnvelopeEip1559_getSignPayload.ErrorType
    | TransactionEnvelopeEip2930_getSignPayload.ErrorType
    | TransactionEnvelopeEip4844_getSignPayload.ErrorType
    | GlobalErrorType
}

TransactionEnvelope_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_getSignPayload.ErrorType
