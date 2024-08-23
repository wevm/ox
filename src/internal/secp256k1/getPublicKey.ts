import { secp256k1 } from '@noble/curves/secp256k1'

import type { GlobalErrorType } from '../errors/error.js'
import { toHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

type As = 'Bytes' | 'Hex'

/**
 * Computes the ECDSA public key from a provided private key.
 *
 * @example
 * ```ts
 * import { Secp256k1 } from 'ox'
 * const publicKey = Secp256k1.getPublicKey({ privateKey: '0x...' })
 * ```
 */
export function getPublicKey<as extends As = 'Hex'>(
  parameters: getPublicKey.Parameters<as>,
): getPublicKey.ReturnType<as> {
  const { privateKey, as = 'Hex' } = parameters
  const bytes = secp256k1.getPublicKey(toHex(privateKey).slice(2), false)
  if (as === 'Hex') return toHex(bytes) as never
  return bytes as never
}

export declare namespace getPublicKey {
  type Parameters<as extends As = 'Hex'> = {
    /** Private key to compute the public key from. */
    privateKey: Hex | Bytes
    /** Format of the returned public key. @default 'Hex' */
    as?: as | As | undefined
  }

  type ReturnType<as extends As = 'Hex'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType = GlobalErrorType
}
