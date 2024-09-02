import type { GlobalErrorType } from '../../Errors/error.js'
import { Hash_keccak256 } from '../../Hash/keccak256.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeLegacy_serialize } from './serialize.js'
import type { TransactionEnvelopeLegacy } from './types.js'

/**
 * Hashes a {@link TransactionEnvelopeLegacy#TransactionEnvelopeLegacy}. This is the "transaction hash".
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeLegacy } from 'ox'
 *
 * const envelope = TransactionEnvelopeLegacy.from({
 *   chainId: 1,
 *   nonce: 0n,
 *   gasPrice: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const hash = TransactionEnvelopeLegacy.hash(envelope) // [!code focus]
 * ```
 *
 * @param envelope - The Legacy Transaction Envelope to hash.
 * @param options -
 * @returns The hash of the transaction envelope.
 */
export function TransactionEnvelopeLegacy_hash(
  envelope: TransactionEnvelopeLegacy,
  options: TransactionEnvelopeLegacy_hash.Options = {},
): TransactionEnvelopeLegacy_hash.ReturnType {
  const { presign } = options
  return Hash_keccak256(
    TransactionEnvelopeLegacy_serialize({
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

export declare namespace TransactionEnvelopeLegacy_hash {
  type Options = {
    /** Whether to hash this transaction for signing. @default false */
    presign?: boolean
  }

  type ReturnType = Hex

  type ErrorType =
    | Hash_keccak256.ErrorType
    | TransactionEnvelopeLegacy_serialize.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeLegacy_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeLegacy_hash.ErrorType
