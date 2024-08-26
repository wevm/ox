import type { GlobalErrorType } from '../../errors/error.js'
import { Hash_keccak256 } from '../../hash/keccak256.js'
import type { Hex } from '../../hex/types.js'
import { TransactionEnvelopeLegacy_serialize } from './serialize.js'
import type { TransactionEnvelopeLegacy } from './types.js'

/**
 * Hashes a {@link TransactionEnvelopeLegacy#TransactionEnvelopeLegacy} for signing.
 *
 * @example
 * // TODO
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
