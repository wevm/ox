import type { GlobalErrorType } from '../../Errors/error.js'
import { Hash_keccak256 } from '../../Hash/keccak256.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeEip7702_serialize } from './serialize.js'
import type { TransactionEnvelopeEip7702 } from './types.js'

/**
 * Hashes a {@link TransactionEnvelope#Eip7702}. This is the "transaction hash".
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip7702 } from 'ox'
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
 * const hash = TransactionEnvelopeEip7702.hash(envelope) // [!code focus]
 * ```
 *
 * @param envelope - The EIP-7702 Transaction Envelope to hash.
 * @param options -
 * @returns The hash of the transaction envelope.
 */
export function TransactionEnvelopeEip7702_hash(
  envelope: TransactionEnvelopeEip7702,
  options: TransactionEnvelopeEip7702_hash.Options = {},
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
  type Options = {
    /** Whether to hash this transaction for signing. @default false */
    presign?: boolean
  }

  type ReturnType = Hex

  type ErrorType =
    | Hash_keccak256.ErrorType
    | TransactionEnvelopeEip7702_serialize.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip7702_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip7702_hash.ErrorType
