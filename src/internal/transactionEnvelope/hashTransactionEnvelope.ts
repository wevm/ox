import type { GlobalErrorType } from '../errors/error.js'
import { keccak256 } from '../hash/keccak256.js'
import type { Hex } from '../types/data.js'
import type { TransactionEnvelope } from '../types/transactionEnvelope.js'
import { serializeTransactionEnvelope } from './serializeTransactionEnvelope.js'

/**
 * Hashes a transaction envelope for signing.
 *
 * @example
 * ```ts
 * import { TransactionEnvelope } from 'ox'
 *
 * const envelope = TransactionEnvelope.from({
 *   chainId: 1,
 *   nonce: 0,
 *   gasPrice: 1000000000n,
 *   gasLimit: 21000,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 *   data: '0x',
 * })
 *
 * const hash = TransactionEnvelope.hash(envelope)
 * // '0x...'
 * ```
 */
export function hashTransactionEnvelope(
  envelope: TransactionEnvelope,
  options: hashTransactionEnvelope.Options = {},
): hashTransactionEnvelope.ReturnType {
  const { presign } = options
  return keccak256(
    serializeTransactionEnvelope({
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

export declare namespace hashTransactionEnvelope {
  type Options = {
    /** Whether to hash this transaction for signing. @default false */
    presign?: boolean
  }

  type ReturnType = Hex

  type ErrorType =
    | keccak256.ErrorType
    | serializeTransactionEnvelope.ErrorType
    | GlobalErrorType
}

hashTransactionEnvelope.parseError = (error: unknown) =>
  error as hashTransactionEnvelope.ErrorType
