import type { GlobalErrorType } from '../../errors/error.js'
import { Hash_keccak256 } from '../../hash/keccak256.js'
import type { Hex } from '../../hex/types.js'
import { TransactionEnvelopeEip7702_serialize } from './serialize.js'
import type { TransactionEnvelopeEip7702 } from './types.js'

/**
 * Hashes a {@link TransactionEnvelope#Eip7702} for signing.
 *
 * @example
 * // TODO
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
