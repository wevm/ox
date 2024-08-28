import { Address_isEqual } from '../address/isEqual.js'
import type { Address } from '../address/types.js'
import type { Bytes } from '../bytes/types.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Hex } from '../hex/types.js'
import type { Signature } from '../signature/types.js'
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
 * @param parameters -
 * @returns Whether the payload was signed by the provided address.
 */
export function Secp256k1_verify(
  parameters: Secp256k1_verify.Parameters,
): Secp256k1_verify.ReturnType {
  const { address, payload, signature } = parameters
  return Address_isEqual(
    address,
    Secp256k1_recoverAddress({ payload, signature }),
  )
}

export declare namespace Secp256k1_verify {
  type Parameters = {
    /** Address that signed the payload. */
    address: Address
    /** Payload that was signed. */
    payload: Hex | Bytes
    /** Signature of the payload. */
    signature: Signature
  }

  type ReturnType = boolean

  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
Secp256k1_verify.parseError = (error: unknown) =>
  error as Secp256k1_verify.ErrorType
