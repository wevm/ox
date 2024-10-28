import { secp256k1 } from '@noble/curves/secp256k1'

import type * as Errors from '../../Errors.js'
import type { Bytes } from '../Bytes/types.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import { PublicKey_from } from '../PublicKey/from.js'
import type { PublicKey } from '../PublicKey/types.js'
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
): PublicKey {
  const { payload, signature } = options
  const { r, s, yParity } = signature
  const signature_ = new secp256k1.Signature(
    BigInt(r),
    BigInt(s),
  ).addRecoveryBit(yParity)
  const point = signature_.recoverPublicKey(Hex_from(payload).substring(2))
  return PublicKey_from(point)
}

export declare namespace Secp256k1_recoverPublicKey {
  type Options = {
    /** Payload that was signed. */
    payload: Hex | Bytes
    /** Signature of the payload. */
    signature: Signature
  }

  type ErrorType =
    | PublicKey_from.ErrorType
    | Hex_from.ErrorType
    | Errors.GlobalErrorType
}

Secp256k1_recoverPublicKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Secp256k1_recoverPublicKey.ErrorType
