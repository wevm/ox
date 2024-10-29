import { p256 } from '@noble/curves/p256'

import type { Errors } from '../../Errors.js'
import type { Hex } from '../../Hex.js'
import { Bytes_from } from '../Bytes/from.js'
import { Bytes_fromArray } from '../Bytes/fromArray.js'
import { Bytes_slice } from '../Bytes/slice.js'
import { Bytes_toBigInt } from '../Bytes/toBigInt.js'
import type { Bytes } from '../Bytes/types.js'
import type { Signature } from '../Signature/types.js'

/**
 * Signs a payload with the provided `CryptoKey` private key and returns a P256 signature.
 *
 * @example
 * ```ts twoslash
 * import { WebCryptoP256 } from 'ox'
 *
 * const { privateKey } = await WebCryptoP256.createKeyPair()
 *
 * const signature = await WebCryptoP256.sign({ // [!code focus]
 *   payload: '0xdeadbeef', // [!code focus]
 *   privateKey, // [!code focus]
 * }) // [!code focus]
 * // @log: {
 * // @log:   r: 151231...4423n,
 * // @log:   s: 516123...5512n,
 * // @log: }
 * ```
 *
 * @param options - Options for signing the payload.
 * @returns The P256 ECDSA {@link ox#Signature.Signature}.
 */
export async function WebCryptoP256_sign(
  options: WebCryptoP256_sign.Options,
): Promise<Signature<false>> {
  const { payload, privateKey } = options
  const signature = await globalThis.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    privateKey,
    Bytes_from(payload),
  )
  const signature_bytes = Bytes_fromArray(new Uint8Array(signature))
  const r = Bytes_toBigInt(Bytes_slice(signature_bytes, 0, 32))
  let s = Bytes_toBigInt(Bytes_slice(signature_bytes, 32, 64))
  if (s > p256.CURVE.n / 2n) s = p256.CURVE.n - s
  return { r, s }
}

export declare namespace WebCryptoP256_sign {
  type Options = {
    /** Payload to sign. */
    payload: Hex | Bytes
    /** ECDSA private key. */
    privateKey: CryptoKey
  }

  type ErrorType = Bytes_fromArray.ErrorType | Errors.GlobalErrorType
}

WebCryptoP256_sign.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebCryptoP256_sign.ErrorType
