import { secp256r1 } from '@noble/curves/p256'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
import type { Signature } from '../Signature/types.js'

/**
 * Verifies a payload was signed by the provided address.
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
 * @returns Whether the payload was signed by the provided address.
 */
export function P256_verify(options: P256_verify.Options): boolean {
  const { payload, publicKey, signature } = options
  return secp256r1.verify(
    signature,
    Hex_from(payload).substring(2),
    Hex_from(publicKey).substring(2),
  )
}

export declare namespace P256_verify {
  type Options = {
    /** Payload that was signed. */
    payload: Hex | Bytes
    /** Public key that signed the payload. */
    publicKey: Hex | Bytes
    /** Signature of the payload. */
    signature: Signature<false>
  }

  type ErrorType = GlobalErrorType
}

/* v8 ignore next */
P256_verify.parseError = (error: unknown) => error as P256_verify.ErrorType
