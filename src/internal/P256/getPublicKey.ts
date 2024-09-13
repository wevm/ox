import { secp256r1 } from '@noble/curves/p256'

import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'

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
export function P256_getPublicKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: P256_getPublicKey.Options<as>,
): P256_getPublicKey.ReturnType<as> {
  const { privateKey, as = 'Hex', compressed = false } = options
  const bytes = secp256r1.getPublicKey(
    Hex_from(privateKey).slice(2),
    compressed,
  )
  if (as === 'Hex') return Hex_from(bytes) as never
  return bytes as never
}

export declare namespace P256_getPublicKey {
  interface Options<as extends 'Hex' | 'Bytes' = 'Hex'> {
    /**
     * Whether to compress the public key.
     */
    compressed?: boolean | undefined
    /**
     * Private key to compute the public key from.
     */
    privateKey: Hex | Bytes
    /**
     * Format of the returned public key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = GlobalErrorType
}
