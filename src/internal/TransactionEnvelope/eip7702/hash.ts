import type { Errors } from '../../../Errors.js'
import { Hash_keccak256 } from '../../Hash/keccak256.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeEip7702_serialize } from './serialize.js'
import type { TransactionEnvelopeEip7702 } from './types.js'

/**
 * Hashes a {@link ox#TransactionEnvelopeEip7702.TransactionEnvelope}. This is the "transaction hash".
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1, TransactionEnvelopeEip7702 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip7702.from({
 *   authorizationList: [...],
 *   chainId: 1,
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelopeEip7702.getSignPayload(envelope),
 *   privateKey: '0x...'
 * })
 *
 * const envelope_signed = TransactionEnvelopeEip7702.from(envelope, { signature })
 *
 * const hash = TransactionEnvelopeEip7702.hash(envelope_signed) // [!code focus]
 * ```
 *
 * @param envelope - The EIP-7702 Transaction Envelope to hash.
 * @param options - Options.
 * @returns The hash of the transaction envelope.
 */
export function TransactionEnvelopeEip7702_hash<
  presign extends boolean = false,
>(
  envelope: TransactionEnvelopeEip7702<presign extends true ? false : true>,
  options: TransactionEnvelopeEip7702_hash.Options<presign> = {},
): TransactionEnvelopeEip7702_hash.ReturnType {
  const { presign } = options
  return Hash_keccak256(
    TransactionEnvelopeEip7702_serialize({
      ...envelope,
      ...(presign
        ? {
            r: undefined,
            s: undefined,
            yParity: undefined,
          }
        : {}),
    }),
  )
}

export declare namespace TransactionEnvelopeEip7702_hash {
  type Options<presign extends boolean = false> = {
    /** Whether to hash this transaction for signing. @default false */
    presign?: presign | boolean | undefined
  }

  type ReturnType = Hex

  type ErrorType =
    | Hash_keccak256.ErrorType
    | TransactionEnvelopeEip7702_serialize.ErrorType
    | Errors.GlobalErrorType
}

TransactionEnvelopeEip7702_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip7702_hash.ErrorType
