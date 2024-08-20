import type { Address } from 'abitype'

import type { GlobalErrorType } from '../errors/error.js'
import { publicKeyToAddress } from '../address/fromPublicKey.js'
import { recoverPublicKey } from './recoverPublicKey.js'

type To = 'bytes' | 'hex'

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
export function recoverAddress<to extends To = 'hex'>(
  parameters: recoverAddress.Parameters<to>,
): recoverAddress.ReturnType {
  return publicKeyToAddress(recoverPublicKey(parameters))
}

export declare namespace recoverAddress {
  type Parameters<to extends To = 'hex'> = recoverPublicKey.Parameters<to>

  type ReturnType = Address

  type ErrorType =
    | publicKeyToAddress.ErrorType
    | recoverPublicKey.ErrorType
    | GlobalErrorType
}

recoverAddress.parseError = (error: unknown) =>
  error as recoverAddress.ErrorType
