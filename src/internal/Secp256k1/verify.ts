import { secp256k1 } from '@noble/curves/secp256k1'
import type { Errors } from '../../Errors.js'
import { Address_isEqual } from '../Address/isEqual.js'
import type { Address } from '../Address/types.js'
import { Bytes_from } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { Hex } from '../Hex/types.js'
import { PublicKey_serialize } from '../PublicKey/serialize.js'
import type { PublicKey } from '../PublicKey/types.js'
import type { Signature } from '../Signature/types.js'
import type { OneOf } from '../types.js'
import { Secp256k1_recoverAddress } from './recoverAddress.js'

/**
 * Verifies a payload was signed by the provided address.
 *
 * @example
 * ### Verify with Ethereum Address
 *
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
 * @example
 * ### Verify with Public Key
 *
 * ```ts twoslash
 * import { Secp256k1 } from 'ox'
 *
 * const privateKey = '0x...'
 * const publicKey = Secp256k1.getPublicKey({ privateKey })
 * const signature = Secp256k1.sign({ payload: '0xdeadbeef', privateKey })
 *
 * const verified = Secp256k1.verify({ // [!code focus]
 *   publicKey, // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the provided address.
 */
export function Secp256k1_verify(options: Secp256k1_verify.Options): boolean {
  const { address, hash, payload, publicKey, signature } = options
  if (address)
    return Address_isEqual(
      address,
      Secp256k1_recoverAddress({ payload, signature }),
    )
  return secp256k1.verify(
    signature,
    Bytes_from(payload),
    PublicKey_serialize(publicKey, { as: 'Bytes' }),
    ...(hash ? [{ prehash: true, lowS: true }] : []),
  )
}

export declare namespace Secp256k1_verify {
  type Options = {
    /** If set to `true`, the payload will be hashed (sha256) before being verified. */
    hash?: boolean | undefined
    /** Payload that was signed. */
    payload: Hex | Bytes
  } & OneOf<
    | {
        /** Address that signed the payload. */
        address: Address
        /** Signature of the payload. */
        signature: Signature
      }
    | {
        /** Public key that signed the payload. */
        publicKey: PublicKey<boolean>
        /** Signature of the payload. */
        signature: Signature<false>
      }
  >

  type ErrorType = Errors.GlobalErrorType
}

Secp256k1_verify.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Secp256k1_verify.ErrorType
