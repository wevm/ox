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
 * ```ts
 * import { Secp256k1 } from 'ox'
 *
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey: '0x...' })
 *
 * const verified = Secp256k1.verify({
 *   address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 *   payload: '0xdeadbeef',
 *   signature,
 * })
 * ```
 */
export function Secp256k1_verify({
  address,
  payload,
  signature,
}: Secp256k1_verify.Parameters): Secp256k1_verify.ReturnType {
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
