import type { Errors } from '../../../Errors.js'
import { Hash_keccak256 } from '../../Hash/keccak256.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeEip4844_serialize } from './serialize.js'
import type { TransactionEnvelopeEip4844 } from './types.js'

/**
 * Hashes a {@link ox#TransactionEnvelopeEip4844.TransactionEnvelope}. This is the "transaction hash".
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
 * @param options - Options.
 * @returns The hash of the transaction envelope.
 */
export function TransactionEnvelopeEip4844_hash<
  presign extends boolean = false,
>(
  envelope: TransactionEnvelopeEip4844<presign extends true ? false : true>,
  options: TransactionEnvelopeEip4844_hash.Options<presign> = {},
): TransactionEnvelopeEip4844_hash.ReturnType {
  const { presign } = options
  return Hash_keccak256(
    TransactionEnvelopeEip4844_serialize({
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

export declare namespace TransactionEnvelopeEip4844_hash {
  type Options<presign extends boolean = false> = {
    /** Whether to hash this transaction for signing. @default false */
    presign?: presign | boolean | undefined
  }

  type ReturnType = Hex

  type ErrorType =
    | Hash_keccak256.ErrorType
    | TransactionEnvelopeEip4844_serialize.ErrorType
    | Errors.GlobalErrorType
}

TransactionEnvelopeEip4844_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip4844_hash.ErrorType
