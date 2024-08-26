import type { GlobalErrorType } from '../../errors/error.js'
import { Hash_keccak256 } from '../../hash/keccak256.js'
import type { Hex } from '../../hex/types.js'
import { TransactionEnvelopeEip2930_serialize } from './serialize.js'
import type { TransactionEnvelopeEip2930 } from './types.js'

/**
 * Hashes a {@link TransactionEnvelope#Eip2930} for signing.
 *
 * @example
 * // TODO
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
