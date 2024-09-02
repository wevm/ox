import { Address_isEqual } from '../Address/isEqual.js'
import type { Address } from '../Address/types.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import type { Hex } from '../Hex/types.js'
import type { Signature } from '../Signature/types.js'
import { Secp256k1_recoverAddress } from './recoverAddress.js'

/**
 * Verifies a payload was signed by the provided address.
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 *
 * const verified = Secp256k1.verify({ // [!code focus]
 *   address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266', // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the provided address.
 */
export function Secp256k1_verify(options: Secp256k1_verify.Options): boolean {
  const { address, payload, signature } = options
  return Address_isEqual(
    address,
    Secp256k1_recoverAddress({ payload, signature }),
  )
}

export declare namespace Secp256k1_verify {
  type Options = {
    /** Address that signed the payload. */
    address: Address
    /** Payload that was signed. */
    payload: Hex | Bytes
    /** Signature of the payload. */
    signature: Signature
  }

  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Secp256k1_verify.parseError = (error: unknown) =>
  error as Secp256k1_verify.ErrorType
