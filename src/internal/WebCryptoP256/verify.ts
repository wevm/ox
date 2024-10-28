import type { Errors } from '../../Errors.js'
import { Bytes_concat } from '../Bytes/concat.js'
import { Bytes_from } from '../Bytes/from.js'
import { Bytes_fromNumber } from '../Bytes/fromNumber.js'
import type { Bytes } from '../Bytes/types.js'
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
 * import { WebCryptoP256 } from 'ox'
 *
 * const { privateKey, publicKey } = await WebCryptoP256.createKeyPair()
 * const signature = await WebCryptoP256.sign({ payload: '0xdeadbeef', privateKey })
 *
 * const verified = await WebCryptoP256.verify({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   publicKey, // [!code focus]
 *   signature, // [!code focus]
 * }) // [!code focus]
 * // @log: true
 * ```
 *
 * @param options - The verification options.
 * @returns Whether the payload was signed by the provided public key.
 */
export async function WebCryptoP256_verify(
  options: WebCryptoP256_verify.Options,
): Promise<boolean> {
  const { payload, signature } = options

  const publicKey = await globalThis.crypto.subtle.importKey(
    'raw',
    PublicKey_serialize(options.publicKey, { as: 'Bytes' }),
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify'],
  )

  return await globalThis.crypto.subtle.verify(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    publicKey,
    Bytes_concat(Bytes_fromNumber(signature.r), Bytes_fromNumber(signature.s)),
    Bytes_from(payload),
  )
}

export declare namespace WebCryptoP256_verify {
  type Options = {
    /** Public key that signed the payload. */
    publicKey: PublicKey<boolean>
    /** Signature of the payload. */
    signature: Signature<false>
    /** Payload that was signed. */
    payload: Hex | Bytes
  }

  type ErrorType = Errors.GlobalErrorType
}

WebCryptoP256_verify.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebCryptoP256_verify.ErrorType
