import { secp256r1 } from '@noble/curves/p256'

import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
import type { Hex } from '../Hex/types.js'

/**
 * Generates a random P256 ECDSA private key.
 *
 * @example
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const privateKey = P256.randomPrivateKey()
 * ```
 *
 * @param options - The options to generate the private key.
 * @returns The generated private key.
 */
export function P256_randomPrivateKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: P256_randomPrivateKey.Options<as> = {},
): P256_randomPrivateKey.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = secp256r1.utils.randomPrivateKey()
  if (as === 'Hex') return Hex_fromBytes(bytes) as never
  return bytes as never
}

export declare namespace P256_randomPrivateKey {
  interface Options<as extends 'Hex' | 'Bytes' = 'Hex'> {
    /**
     * Format of the returned private key.
     * @default 'Hex'
     */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = Hex_fromBytes.ErrorType | GlobalErrorType
}
