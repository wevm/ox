import type * as Errors from '../../../Errors.js'
import * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import type { Hex } from '../../Hex/types.js'

/**
 * Returns the payload to sign for a {@link ox#TransactionEnvelope.Eip7702}.
 *
 * @example
 * The example below demonstrates how to compute the sign payload which can be used
 * with ECDSA signing utilities like {@link ox#Secp256k1.(sign:function)}.
 *
 * ```ts twoslash
 * // @noErrors
 * import { Secp256k1, TransactionEnvelopeEip7702 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip7702.from({
 *   authorizationList: [...],
 *   chainId: 1,
 *   nonce: 0n,
 *   maxFeePerGas: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const payload = TransactionEnvelopeEip7702.getSignPayload(envelope) // [!code focus]
 * // @log: '0x...'
 *
 * const signature = Secp256k1.sign({ payload, privateKey: '0x...' })
 * ```
 *
 * @param envelope - The transaction envelope to get the sign payload for.
 * @returns The sign payload.
 */
export function getSignPayload(
  envelope: TransactionEnvelopeEip7702.TransactionEnvelope,
): getSignPayload.ReturnType {
  return TransactionEnvelopeEip7702.hash(envelope, { presign: true })
}

export declare namespace getSignPayload {
  type ReturnType = Hex

  type ErrorType =
    | TransactionEnvelopeEip7702.hash.ErrorType
    | Errors.GlobalErrorType
}

getSignPayload.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as getSignPayload.ErrorType
