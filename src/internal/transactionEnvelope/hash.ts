import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../hex/types.js'
import type { OneOf } from '../types.js'
import { TransactionEnvelopeEip1559_hash } from './eip1559/hash.js'
import { TransactionEnvelopeEip2930_hash } from './eip2930/hash.js'
import { TransactionEnvelopeEip4844_hash } from './eip4844/hash.js'
import { TransactionTypeNotImplementedError } from './errors.js'
import { TransactionEnvelopeLegacy_hash } from './legacy/hash.js'
import type { TransactionEnvelope } from './types.js'

/**
 * Hashes a transaction envelope for signing.
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
 * const hash = TransactionEnvelope.hash(envelope)
 * // '0x...'
 * ```
 */
export function TransactionEnvelope_hash(
  envelope: TransactionEnvelope,
  options: TransactionEnvelope_hash.Options = {},
): TransactionEnvelope_hash.ReturnType {
  if (envelope.type === 'legacy')
    return TransactionEnvelopeLegacy_hash(envelope, options)
  if (envelope.type === 'eip2930')
    return TransactionEnvelopeEip2930_hash(envelope, options)
  if (envelope.type === 'eip1559')
    return TransactionEnvelopeEip1559_hash(envelope, options)
  if (envelope.type === 'eip4844')
    return TransactionEnvelopeEip4844_hash(envelope, options)

  // TODO: EIP-7702

  throw new TransactionTypeNotImplementedError({ type: envelope.type })
}

export declare namespace TransactionEnvelope_hash {
  type Options = OneOf<
    | TransactionEnvelopeLegacy_hash.Options
    | TransactionEnvelopeEip1559_hash.Options
    | TransactionEnvelopeEip2930_hash.Options
    | TransactionEnvelopeEip4844_hash.Options
  >

  type ReturnType = Hex

  type ErrorType =
    | TransactionEnvelopeLegacy_hash.ErrorType
    | TransactionEnvelopeEip1559_hash.ErrorType
    | TransactionEnvelopeEip2930_hash.ErrorType
    | TransactionEnvelopeEip4844_hash.ErrorType
    | GlobalErrorType
}

TransactionEnvelope_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_hash.ErrorType
