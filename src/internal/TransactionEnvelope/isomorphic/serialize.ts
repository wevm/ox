import type { BlobSidecars } from '../../Blobs/types.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'
import type { Signature } from '../../Signature/types.js'
import { TransactionEnvelopeEip1559_serialize } from '../eip1559/serialize.js'
import { TransactionEnvelopeEip2930_serialize } from '../eip2930/serialize.js'
import { TransactionEnvelopeEip4844_serialize } from '../eip4844/serialize.js'
import { TransactionEnvelopeEip7702_serialize } from '../eip7702/serialize.js'
import { TransactionTypeNotImplementedError } from '../errors.js'
import { TransactionEnvelopeLegacy_serialize } from '../legacy/serialize.js'
import type {
  TransactionEnvelope,
  TransactionEnvelope_Serialized,
} from './types.js'

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
export function TransactionEnvelope_serialize<
  envelope extends TransactionEnvelope,
>(
  envelope: envelope,
  options: TransactionEnvelope_serialize.Options = {},
): TransactionEnvelope_serialize.ReturnType<envelope> {
  if (envelope.type === 'legacy')
    return TransactionEnvelopeLegacy_serialize(envelope, options) as never
  if (envelope.type === 'eip2930')
    return TransactionEnvelopeEip2930_serialize(envelope, options) as never
  if (envelope.type === 'eip1559')
    return TransactionEnvelopeEip1559_serialize(envelope, options) as never
  if (envelope.type === 'eip4844')
    return TransactionEnvelopeEip4844_serialize(envelope, options) as never
  if (envelope.type === 'eip7702')
    return TransactionEnvelopeEip7702_serialize(envelope, options) as never

  throw new TransactionTypeNotImplementedError({ type: (envelope as any).type })
}

export declare namespace TransactionEnvelope_serialize {
  type Options = {
    /** Signature to append to the serialized Transaction Envelope. */
    signature?: Signature | undefined
    /** (EIP-4844 only) Sidecars to append to the serialized Transaction Envelope. */
    sidecars?: BlobSidecars<Hex> | undefined
  }

  type ReturnType<envelope extends TransactionEnvelope = TransactionEnvelope> =
    TransactionEnvelope_Serialized<envelope['type']>

  type ErrorType =
    | TransactionEnvelopeLegacy_serialize.ErrorType
    | TransactionEnvelopeEip2930_serialize.ErrorType
    | TransactionEnvelopeEip1559_serialize.ErrorType
    | TransactionEnvelopeEip4844_serialize.ErrorType
    | TransactionEnvelopeEip7702_serialize.ErrorType
    | TransactionTypeNotImplementedError
    | GlobalErrorType
}

TransactionEnvelope_serialize.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_serialize.ErrorType
