import { secp256k1 } from '@noble/curves/secp256k1'

import type { GlobalErrorType } from '../errors/error.js'
import { toHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

type To = 'bytes' | 'hex'

/**
 * Computes the ECDSA public key from a provided private key.
 *
 * @example
 * ```ts
 * import { Secp256k1 } from 'ox'
 * const publicKey = Secp256k1.getPublicKey({ privateKey: '0x...' })
 * ```
 */
export function getPublicKey<to extends To = 'hex'>(
  parameters: getPublicKey.Parameters<to>,
): getPublicKey.ReturnType<to> {
  const { privateKey, to = 'hex' } = parameters
  const bytes = secp256k1.getPublicKey(toHex(privateKey).slice(2), false)
  if (to === 'hex') return toHex(bytes) as never
  return bytes as never
}

export declare namespace getPublicKey {
  type Parameters<to extends To = 'hex'> = {
    /** Private key to compute the public key from. */
    privateKey: Hex | Bytes
    /** Format of the returned public key. @default 'hex' */
    to?: to | To | undefined
  }

  type ReturnType<to extends To = 'hex'> =
    | (to extends 'bytes' ? Bytes : never)
    | (to extends 'hex' ? Hex : never)

  type ErrorType = GlobalErrorType
}
