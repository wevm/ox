import { secp256r1 } from '@noble/curves/p256'

import type { Bytes } from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import * as PublicKey from '../../PublicKey.js'

/**
 * Computes the P256 ECDSA public key from a provided private key.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const publicKey = P256.getPublicKey({ privateKey: '0x...' })
 * ```
 *
 * @param options - The options to compute the public key.
 * @returns The computed public key.
 */
export function P256_getPublicKey(
  options: P256_getPublicKey.Options,
): PublicKey.PublicKey {
  const { privateKey } = options
  const point = secp256r1.ProjectivePoint.fromPrivateKey(
    typeof privateKey === 'string'
      ? privateKey.slice(2)
      : Hex.fromBytes(privateKey).slice(2),
  )
  return PublicKey.from(point)
}

export declare namespace P256_getPublicKey {
  type Options = {
    /**
     * Private key to compute the public key from.
     */
    privateKey: Hex.Hex | Bytes
  }

  type ErrorType = Errors.GlobalErrorType
}
