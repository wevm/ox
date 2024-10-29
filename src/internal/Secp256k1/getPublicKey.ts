import { secp256k1 } from '@noble/curves/secp256k1'

import type { Errors } from '../../Errors.js'
import { Hex } from '../../Hex.js'
import type { Bytes } from '../Bytes/types.js'
import { PublicKey_from } from '../PublicKey/from.js'
import type { PublicKey } from '../PublicKey/types.js'

/**
 * Computes the secp256k1 ECDSA public key from a provided private key.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const publicKey = Secp256k1.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @param options - The options to compute the public key.
 * @returns The computed public key.
 */
export function Secp256k1_getPublicKey(
  options: Secp256k1_getPublicKey.Options,
): PublicKey {
  const { privateKey } = options
  const point = secp256k1.ProjectivePoint.fromPrivateKey(
    Hex.from(privateKey).slice(2),
  )
  return PublicKey_from(point)
}

export declare namespace Secp256k1_getPublicKey {
  type Options = {
    /**
     * Private key to compute the public key from.
     */
    privateKey: Hex | Bytes
  }

  type ErrorType =
    | Hex.from.ErrorType
    | PublicKey_from.ErrorType
    | Errors.GlobalErrorType
}
