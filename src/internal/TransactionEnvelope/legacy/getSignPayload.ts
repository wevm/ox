import type { GlobalErrorType } from '../../Errors/error.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeLegacy_hash } from './hash.js'
import type { TransactionEnvelopeLegacy } from './types.js'

/**
 * Returns the payload to sign for a {@link TransactionEnvelope#Legacy}.
 *
 * @example
 * The example below demonstrates how to compute the sign payload which can be used
 * with ECDSA signing utilities like {@link Secp256k1#sign}.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1, TransactionEnvelopeLegacy } from 'ox'
 *
 * const envelope = TransactionEnvelopeLegacy.from({
 *   nonce: 0n,
 *   gasPrice: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const payload = TransactionEnvelopeLegacy.getSignPayload(envelope) // [!code focus]
 * // @log: '0x...'
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param envelope - The transaction envelope to get the sign payload for.
 * @returns The sign payload.
 */
export function TransactionEnvelopeLegacy_getSignPayload(
  envelope: TransactionEnvelopeLegacy,
): TransactionEnvelopeLegacy_getSignPayload.ReturnType {
  return TransactionEnvelopeLegacy_hash(envelope, { presign: true })
}

export declare namespace TransactionEnvelopeLegacy_getSignPayload {
  type ReturnType = Hex

  type ErrorType = TransactionEnvelopeLegacy_hash.ErrorType | GlobalErrorType
}

TransactionEnvelopeLegacy_getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeLegacy_getSignPayload.ErrorType
