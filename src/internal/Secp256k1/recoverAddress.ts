import { Address_fromPublicKey } from '../Address/fromPublicKey.js'
import type { Address } from '../Address/types.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import type { Signature } from '../Signature/types.js'
import { Secp256k1_recoverPublicKey } from './recoverPublicKey.js'

/**
 * Recovers the signing address from the signed payload and signature.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 *
 * const address = Secp256k1.recoverAddress({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The recovery options.
 * @returns The recovered address.
 */
export function Secp256k1_recoverAddress(
  options: Secp256k1_recoverAddress.Options,
): Secp256k1_recoverAddress.ReturnType {
  return Address_fromPublicKey(Secp256k1_recoverPublicKey(options))
}

export declare namespace Secp256k1_recoverAddress {
  type Options = {
    /** Payload that was signed. */
    payload: Hex | Bytes
    /** Signature of the payload. */
    signature: Signature
  }

  type ReturnType = Address

  type ErrorType =
    | Address_fromPublicKey.ErrorType
    | Secp256k1_recoverPublicKey.ErrorType
    | GlobalErrorType
}

Secp256k1_recoverAddress.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Secp256k1_recoverAddress.ErrorType
