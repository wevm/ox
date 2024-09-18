import { secp256r1 } from '@noble/curves/p256'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import { PublicKey_serialize } from '../PublicKey/serialize.js'
import type { PublicKey } from '../PublicKey/types.js'
import type { Signature } from '../Signature/types.js'

/**
 * Verifies a payload was signed by the provided public key.
 *
 * @example
 *
 * ```ts twoslash
 * import { P256 } from 'ox'
 *
 * const privateKey = '0x...'
 * const publicKey = P256.getPublicKey({ privateKey })
 * const signature = P256.sign({ payload: '0xdeadbeef', privateKey })
 *
 * const verified = P256.verify({ // [!code focus]
 *   publicKey, // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the provided public key.
 */
export function P256_verify(options: P256_verify.Options): boolean {
  const { hash, payload, publicKey, signature } = options
  return secp256r1.verify(
    signature,
    typeof payload === 'string'
      ? payload.substring(2)
      : Hex_from(payload).substring(2),
    PublicKey_serialize(publicKey).substring(2),
    ...(hash ? [{ prehash: true, lowS: true }] : []),
  )
}

export declare namespace P256_verify {
  type Options = {
    /** If set to `true`, the payload will be hashed (sha256) before being verified. */
    hash?: boolean | undefined
    /** Payload that was signed. */
    payload: Hex | Bytes
    /** Public key that signed the payload. */
    publicKey: PublicKey<boolean>
    /** Signature of the payload. */
    signature: Signature<boolean>
  }

  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
P256_verify.parseError = (error: unknown) => error as P256_verify.ErrorType
