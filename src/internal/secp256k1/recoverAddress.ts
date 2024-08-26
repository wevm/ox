import type { Address } from 'abitype'

import { Address_fromPublicKey } from '../address/fromPublicKey.js'
import type { GlobalErrorType } from '../errors/error.js'
import { Secp256k1_recoverPublicKey } from './recoverPublicKey.js'

/**
 * Recovers the signing address from the signed payload and signature.
 *
 * @example
 * ```ts
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 *
 * const address = Secp256k1.recoverAddress({
 *   payload: '0xdeadbeef',
 *   signature,
 * })
 * ```
 */
export function Secp256k1_recoverAddress<as extends 'Hex' | 'Bytes' = 'Hex'>(
  parameters: Secp256k1_recoverAddress.Parameters<as>,
): Secp256k1_recoverAddress.ReturnType {
  return Address_fromPublicKey(Secp256k1_recoverPublicKey(parameters))
}

export declare namespace Secp256k1_recoverAddress {
  type Parameters<as extends 'Hex' | 'Bytes' = 'Hex'> =
    Secp256k1_recoverPublicKey.Parameters<as>

  type ReturnType = Address

  type ErrorType =
    | Address_fromPublicKey.ErrorType
    | Secp256k1_recoverPublicKey.ErrorType
    | GlobalErrorType
}

Secp256k1_recoverAddress.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Secp256k1_recoverAddress.ErrorType
