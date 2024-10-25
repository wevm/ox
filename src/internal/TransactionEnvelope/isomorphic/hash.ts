import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'
import type { OneOf } from '../../types.js'
import { TransactionEnvelopeEip1559_hash } from '../eip1559/hash.js'
import { TransactionEnvelopeEip2930_hash } from '../eip2930/hash.js'
import { TransactionEnvelopeEip4844_hash } from '../eip4844/hash.js'
import { TransactionEnvelopeEip7702_hash } from '../eip7702/hash.js'
import { TransactionEnvelope_TypeNotImplementedError } from '../errors.js'
import { TransactionEnvelopeLegacy_hash } from '../legacy/hash.js'
import type { TransactionEnvelope } from './types.js'

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
 * @param options - Options.
 * @returns The hash of the transaction envelope.
 */
export function TransactionEnvelope_hash<presign extends boolean = false>(
  envelope: TransactionEnvelope<presign extends true ? false : true>,
  options: TransactionEnvelope_hash.Options<presign> = {},
): TransactionEnvelope_hash.ReturnType {
  const envelope_ = envelope as any
  if (envelope_.type === 'legacy')
    return TransactionEnvelopeLegacy_hash(envelope_, options)
  if (envelope_.type === 'eip2930')
    return TransactionEnvelopeEip2930_hash(envelope_, options)
  if (envelope_.type === 'eip1559')
    return TransactionEnvelopeEip1559_hash(envelope_, options)
  if (envelope_.type === 'eip4844')
    return TransactionEnvelopeEip4844_hash(envelope_, options)
  if (envelope_.type === 'eip7702')
    return TransactionEnvelopeEip7702_hash(envelope_, options)

  throw new TransactionEnvelope_TypeNotImplementedError({
    type: envelope_.type,
  })
}

export declare namespace TransactionEnvelope_hash {
  type Options<presign extends boolean = false> = OneOf<
    | TransactionEnvelopeLegacy_hash.Options<presign>
    | TransactionEnvelopeEip1559_hash.Options<presign>
    | TransactionEnvelopeEip2930_hash.Options<presign>
    | TransactionEnvelopeEip4844_hash.Options<presign>
    | TransactionEnvelopeEip7702_hash.Options<presign>
  >

  type ReturnType = Hex

  type ErrorType =
    | TransactionEnvelopeLegacy_hash.ErrorType
    | TransactionEnvelopeEip1559_hash.ErrorType
    | TransactionEnvelopeEip2930_hash.ErrorType
    | TransactionEnvelopeEip4844_hash.ErrorType
    | TransactionEnvelopeEip7702_hash.ErrorType
    | GlobalErrorType
}

TransactionEnvelope_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_hash.ErrorType
