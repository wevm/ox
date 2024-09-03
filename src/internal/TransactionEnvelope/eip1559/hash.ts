import type { GlobalErrorType } from '../../Errors/error.js'
import { Hash_keccak256 } from '../../Hash/keccak256.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeEip1559_serialize } from './serialize.js'
import type { TransactionEnvelopeEip1559 } from './types.js'

/**
 * Hashes a {@link TransactionEnvelope#Eip1559}. This is the "transaction hash".
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip1559 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip1559.from({
 *   chainId: 1,
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const hash = TransactionEnvelopeEip1559.hash(envelope) // [!code focus]
 * ```
 *
 * @param envelope - The EIP-1559 Transaction Envelope to hash.
 * @param options -
 * @returns The hash of the transaction envelope.
 */
export function TransactionEnvelopeEip1559_hash(
  envelope: TransactionEnvelopeEip1559,
  options: TransactionEnvelopeEip1559_hash.Options = {},
): TransactionEnvelopeEip1559_hash.ReturnType {
  const { presign } = options
  return Hash_keccak256(
    TransactionEnvelopeEip1559_serialize({
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

export declare namespace TransactionEnvelopeEip1559_hash {
  type Options = {
    /** Whether to hash this transaction for signing. @default false */
    presign?: boolean
  }

  type ReturnType = Hex

  type ErrorType =
    | Hash_keccak256.ErrorType
    | TransactionEnvelopeEip1559_serialize.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip1559_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip1559_hash.ErrorType
