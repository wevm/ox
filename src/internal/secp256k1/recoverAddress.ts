import type { Address } from 'abitype'

import { publicKeyToAddress } from '../address/publicKeyToAddress.js'
import type { GlobalErrorType } from '../errors/error.js'
import { recoverPublicKey } from './recoverPublicKey.js'

type As = 'Bytes' | 'Hex'

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
export function recoverAddress<as extends As = 'Hex'>(
  parameters: recoverAddress.Parameters<as>,
): recoverAddress.ReturnType {
  return publicKeyToAddress(recoverPublicKey(parameters))
}

export declare namespace recoverAddress {
  type Parameters<as extends As = 'Hex'> = recoverPublicKey.Parameters<as>

  type ReturnType = Address

  type ErrorType =
    | publicKeyToAddress.ErrorType
    | recoverPublicKey.ErrorType
    | GlobalErrorType
}

recoverAddress.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as recoverAddress.ErrorType
