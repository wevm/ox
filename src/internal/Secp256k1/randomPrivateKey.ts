import { secp256k1 } from '@noble/curves/secp256k1'

import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_fromBytes } from '../Hex/fromBytes.js'
import type { Hex } from '../Hex/types.js'

/**
 * Generates a random ECDSA private key on the secp256k1 curve.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const privateKey = Secp256k1.randomPrivateKey()
 * ```
 *
 * @param options - The options to generate the private key.
 * @returns The generated private key.
 */
export function Secp256k1_randomPrivateKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: Secp256k1_randomPrivateKey.Options<as> = {},
): Secp256k1_randomPrivateKey.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = secp256k1.utils.randomPrivateKey()
  if (as === 'Hex') return Hex_fromBytes(bytes) as never
  return bytes as never
}

export declare namespace Secp256k1_randomPrivateKey {
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
