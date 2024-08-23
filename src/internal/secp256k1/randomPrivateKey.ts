import { secp256k1 } from '@noble/curves/secp256k1'

import type { GlobalErrorType } from '../errors/error.js'
import { toHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

/**
 * Generates a random ECDSA private key on the secp256k1 curve.
 *
 * @example
 * ```ts
 * import { Secp256k1 } from 'ox'
 * const privateKey = Secp256k1.randomPrivateKey()
 * ```
 */
export function randomPrivateKey<as extends 'Hex' | 'Bytes' = 'Hex'>(
  options: randomPrivateKey.Options<as> = {},
): randomPrivateKey.ReturnType<as> {
  const { as = 'Hex' } = options
  const bytes = secp256k1.utils.randomPrivateKey()
  if (as === 'Hex') return toHex(bytes) as never
  return bytes as never
}

export declare namespace randomPrivateKey {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** Format of the returned private key. @default 'Hex' */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = toHex.ErrorType | GlobalErrorType
}
