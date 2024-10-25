import type * as Errors from '../../../Errors.js'
import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import type { BlobSidecars } from '../../Blobs/types.js'
import type { Hex } from '../../Hex/types.js'
import type { Signature } from '../../Signature/types.js'

/**
 * Serializes a {@link ox#TransactionEnvelope.TransactionEnvelope}.
 *
 * @example
 * ```ts twoslash
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
 * const serialized = TransactionEnvelope.serialize(envelope) // [!code focus]
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * It is possible to attach a `signature` to the serialized Transaction Envelope.
 *
 * ```ts twoslash
 * import { Secp256k1, TransactionEnvelope, Value } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   maxFeePerGas: Value.fromGwei('10'),
 *   maxPriorityFeePerGas: Value.fromGwei('1'),
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelope.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const serialized = TransactionEnvelope.serialize(envelope, { // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 *
 * // ... send `serialized` transaction to JSON-RPC `eth_sendRawTransaction`
 * ```
 *
 * @param envelope - The Transaction Envelope to serialize.
 * @returns The serialized Transaction Envelope.
 */
export function serialize<
  envelope extends TransactionEnvelope.TransactionEnvelope,
>(
  envelope: envelope,
  options: serialize.Options = {},
): serialize.ReturnType<envelope> {
  if (envelope.type === 'legacy')
    return TransactionEnvelopeLegacy.serialize(envelope, options) as never
  if (envelope.type === 'eip2930')
    return TransactionEnvelopeEip2930.serialize(envelope, options) as never
  if (envelope.type === 'eip1559')
    return TransactionEnvelopeEip1559.serialize(envelope, options) as never
  if (envelope.type === 'eip4844')
    return TransactionEnvelopeEip4844.serialize(envelope, options) as never
  if (envelope.type === 'eip7702')
    return TransactionEnvelopeEip7702.serialize(envelope, options) as never

  throw new TransactionEnvelope.TypeNotImplementedError({
    type: (envelope as any).type,
  })
}

export declare namespace serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
    /** (EIP-4844 only) Sidecars to append to the serialized Transaction Envelope. */
    sidecars?: BlobSidecars<Hex> | undefined
  }

  type ReturnType<
    envelope extends
      TransactionEnvelope.TransactionEnvelope = TransactionEnvelope.TransactionEnvelope,
  > = TransactionEnvelope.Serialized<envelope['type']>

  type ErrorType =
    | TransactionEnvelopeLegacy.serialize.ErrorType
    | TransactionEnvelopeEip2930.serialize.ErrorType
    | TransactionEnvelopeEip1559.serialize.ErrorType
    | TransactionEnvelopeEip4844.serialize.ErrorType
    | TransactionEnvelopeEip7702.serialize.ErrorType
    | TransactionEnvelope.TypeNotImplementedError
    | Errors.GlobalErrorType
}

serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as serialize.ErrorType
