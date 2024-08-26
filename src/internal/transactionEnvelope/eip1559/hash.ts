import type { GlobalErrorType } from '../../errors/error.js'
import { Hash_keccak256 } from '../../hash/keccak256.js'
import type { Hex } from '../../hex/types.js'
import { TransactionEnvelopeEip1559_serialize } from './serialize.js'
import type { TransactionEnvelopeEip1559 } from './types.js'

/**
 * Hashes a {@link TransactionEnvelope#Eip1559} for signing.
 *
 * @example
 * // TODO
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
