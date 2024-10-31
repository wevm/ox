import { secp256r1 } from '@noble/curves/p256'

import type { Bytes } from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import type { Signature } from '../Signature/types.js'
import * as PublicKey from '../../PublicKey.js'

/**
 * Recovers the signing public key from the signed payload and signature.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const signature = P256.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 *
 * const publicKey = P256.recoverPublicKey({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The recovery options.
 * @returns The recovered public key.
 */
export function P256_recoverPublicKey(
  options: P256_recoverPublicKey.Options,
): PublicKey.PublicKey {
  const { payload, signature } = options
  const { r, s, yParity } = signature
  const signature_ = new secp256r1.Signature(
    BigInt(r),
    BigInt(s),
  ).addRecoveryBit(yParity)
  const payload_ =
    payload instanceof Uint8Array ? Hex.fromBytes(payload) : payload
  const point = signature_.recoverPublicKey(payload_.substring(2))
  return PublicKey.from(point)
}

export declare namespace P256_recoverPublicKey {
  type Options = {
    /** Payload that was signed. */
    payload: Hex.Hex | Bytes
    /** Signature of the payload. */
    signature: Signature
  }

  type ErrorType =
    | PublicKey.from.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

P256_recoverPublicKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as P256_recoverPublicKey.ErrorType
