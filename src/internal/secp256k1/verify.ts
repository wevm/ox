import type { Address } from 'abitype'

import { isAddressEqual } from '../address/isAddressEqual.js'
import type { GlobalErrorType } from '../errors/error.js'
import type { Bytes, Hex } from '../types/data.js'
import type { Signature } from '../types/signature.js'
import { recoverAddress } from './recoverAddress.js'

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
export function verify({
  address,
  payload,
  signature,
}: verify.Parameters): verify.ReturnType {
  return isAddressEqual(address, recoverAddress({ payload, signature }))
}

export declare namespace verify {
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

verify.parseError = (error: unknown) => error as verify.ErrorType
