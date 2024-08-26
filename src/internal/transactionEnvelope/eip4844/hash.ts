import type { GlobalErrorType } from '../../errors/error.js'
import { Hash_keccak256 } from '../../hash/keccak256.js'
import type { Hex } from '../../hex/types.js'
import { TransactionEnvelopeEip4844_serialize } from './serialize.js'
import type { TransactionEnvelopeEip4844 } from './types.js'

/**
 * Hashes a {@link TransactionEnvelope#Eip4844} for signing.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelopeEip4844_hash(
  envelope: TransactionEnvelopeEip4844,
  options: TransactionEnvelopeEip4844_hash.Options = {},
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
  type Options = {
    /** Whether to hash this transaction for signing. @default false */
    presign?: boolean
  }

  type ReturnType = Hex

  type ErrorType =
    | Hash_keccak256.ErrorType
    | TransactionEnvelopeEip4844_serialize.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip4844_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip4844_hash.ErrorType
