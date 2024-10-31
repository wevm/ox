import { secp256k1 } from '@noble/curves/secp256k1'

import type { Bytes } from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import * as PublicKey from '../../PublicKey.js'
import type { Signature } from '../Signature/types.js'

/**
 * Recovers the signing public key from the signed payload and signature.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 *
 * const publicKey = Secp256k1.recoverPublicKey({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The recovery options.
 * @returns The recovered public key.
 */
export function Secp256k1_recoverPublicKey(
  options: Secp256k1_recoverPublicKey.Options,
): PublicKey.PublicKey {
  const { payload, signature } = options
  const { r, s, yParity } = signature
  const signature_ = new secp256k1.Signature(
    BigInt(r),
    BigInt(s),
  ).addRecoveryBit(yParity)
  const point = signature_.recoverPublicKey(Hex.from(payload).substring(2))
  return PublicKey.from(point)
}

export declare namespace Secp256k1_recoverPublicKey {
  type Options = {
    /** Payload that was signed. */
    payload: Hex.Hex | Bytes
    /** Signature of the payload. */
    signature: Signature
  }

  type ErrorType =
    | PublicKey.from.ErrorType
    | Hex.from.ErrorType
    | Errors.GlobalErrorType
}

Secp256k1_recoverPublicKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Secp256k1_recoverPublicKey.ErrorType
