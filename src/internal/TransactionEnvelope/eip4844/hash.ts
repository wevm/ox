import * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import { keccak256 } from '../../Hash/keccak256.js'
import type { Hex } from '../../Hex/types.js'

/**
 * Hashes a {@link ox#TransactionEnvelope.Eip4844}. This is the "transaction hash".
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Blobs, TransactionEnvelopeEip4844 } from 'ox'
 * import { kzg } from './kzg'
 *
 * const blobs = Blobs.from('0xdeadbeef')
 * const blobVersionedHashes = Blobs.toVersionedHashes(blobs, { kzg })
 *
 * const envelope = TransactionEnvelopeEip4844.from({
 *   blobVersionedHashes,
 *   chainId: 1,
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const hash = TransactionEnvelopeEip4844.hash(envelope) // [!code focus]
 * ```
 *
 * @param envelope - The EIP-4844 Transaction Envelope to hash.
 * @param options -
 * @returns The hash of the transaction envelope.
 */
export function hash(
  envelope: TransactionEnvelopeEip4844.TransactionEnvelope,
  options: hash.Options = {},
): hash.ReturnType {
  const { presign } = options
  return keccak256(
    TransactionEnvelopeEip4844.serialize({
      ...envelope,
      ...(presign
        ? {
            sidecars: undefined,
            r: undefined,
            s: undefined,
            yParity: undefined,
            v: undefined,
          }
        : {}),
    }),
  )
}

export declare namespace hash {
  type Options = {
    /** Whether to hash this transaction for signing. @default false */
    presign?: boolean | undefined
  }

  type ReturnType = Hex

  type ErrorType =
    | keccak256.ErrorType
    | TransactionEnvelopeEip4844.serialize.ErrorType
    | GlobalErrorType
}

hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as hash.ErrorType
