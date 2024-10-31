import { secp256k1 } from '@noble/curves/secp256k1'

import type { Bytes } from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import * as PublicKey from '../../PublicKey.js'

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
): PublicKey.PublicKey {
  const { privateKey } = options
  const point = secp256k1.ProjectivePoint.fromPrivateKey(
    Hex.from(privateKey).slice(2),
  )
  return PublicKey.from(point)
}

export declare namespace Secp256k1_getPublicKey {
  type Options = {
    /**
     * Private key to compute the public key from.
     */
    privateKey: Hex.Hex | Bytes
  }

  type ErrorType =
    | Hex.from.ErrorType
    | PublicKey.from.ErrorType
    | Errors.GlobalErrorType
}
