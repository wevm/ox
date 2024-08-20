import { secp256k1 } from '@noble/curves/secp256k1'

import type { GlobalErrorType } from '../errors/error.js'
import { toHex } from '../hex/toHex.js'
import type { Bytes, Hex } from '../types/data.js'

type To = 'bytes' | 'hex'

/**
 * Generates a random ECDSA private key on the secp256k1 curve.
 *
 * @example
 * ```ts
 * import { Secp256k1 } from 'ox'
 * const privateKey = Secp256k1.randomPrivateKey()
 * ```
 */
export function randomPrivateKey<to extends To = 'hex'>(
  options: randomPrivateKey.Options<to> = {},
): randomPrivateKey.ReturnType<to> {
  const { to = 'hex' } = options
  const bytes = secp256k1.utils.randomPrivateKey()
  if (to === 'hex') return toHex(bytes) as never
  return bytes as never
}

export declare namespace randomPrivateKey {
  type Options<to extends To = 'hex'> = {
    /** Format of the returned private key. @default 'hex' */
    to?: to | To | undefined
  }

  type ReturnType<to extends To> =
    | (to extends 'bytes' ? Bytes : never)
    | (to extends 'hex' ? Hex : never)

  type ErrorType = toHex.ErrorType | GlobalErrorType
}
