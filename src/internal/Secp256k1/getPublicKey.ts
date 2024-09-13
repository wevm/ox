import { secp256k1 } from '@noble/curves/secp256k1'

import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'

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
export function Secp256k1_getPublicKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: Secp256k1_getPublicKey.Options<as>,
): Secp256k1_getPublicKey.ReturnType<as> {
  const { privateKey, as = 'Hex', compressed = false } = options
  const bytes = secp256k1.getPublicKey(
    Hex_from(privateKey).slice(2),
    compressed,
  )
  if (as === 'Hex') return Hex_from(bytes) as never
  return bytes as never
}

export declare namespace Secp256k1_getPublicKey {
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
