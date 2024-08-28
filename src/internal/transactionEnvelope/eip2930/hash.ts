import type { GlobalErrorType } from '../../errors/error.js'
import { Hash_keccak256 } from '../../hash/keccak256.js'
import type { Hex } from '../../hex/types.js'
import { TransactionEnvelopeEip2930_serialize } from './serialize.js'
import type { TransactionEnvelopeEip2930 } from './types.js'

/**
 * Hashes a {@link TransactionEnvelope#Eip2930}. This is the "transaction hash".
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip2930 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip2930.from({
 *   chainId: 1,
 *   nonce: 0n,
 *   gasPrice: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const hash = TransactionEnvelopeEip2930.hash(envelope) // [!code focus]
 * ```
 *
 * @param envelope - The EIP-2930 Transaction Envelope to hash.
 * @param options -
 * @returns The hash of the transaction envelope.
 */
export function TransactionEnvelopeEip2930_hash(
  envelope: TransactionEnvelopeEip2930,
  options: TransactionEnvelopeEip2930_hash.Options = {},
): TransactionEnvelopeEip2930_hash.ReturnType {
  const { presign } = options
  return Hash_keccak256(
    TransactionEnvelopeEip2930_serialize({
      ...envelope,
      ...(presign
        ? {
            r: undefined,
            s: undefined,
            yParity: undefined,
            v: undefined,
          }
        : {}),
    }),
  )
}

export declare namespace TransactionEnvelopeEip2930_hash {
  type Options = {
    /** Whether to hash this transaction for signing. @default false */
    presign?: boolean
  }

  type ReturnType = Hex

  type ErrorType =
    | Hash_keccak256.ErrorType
    | TransactionEnvelopeEip2930_serialize.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip2930_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip2930_hash.ErrorType
