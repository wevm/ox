import { p256 } from '@noble/curves/p256'

import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import type { Hex } from '../../Hex.js'
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
    Bytes.from(payload),
  )
  const signature_bytes = Bytes.fromArray(new Uint8Array(signature))
  const r = Bytes.toBigInt(Bytes.slice(signature_bytes, 0, 32))
  let s = Bytes.toBigInt(Bytes.slice(signature_bytes, 32, 64))
  if (s > p256.CURVE.n / 2n) s = p256.CURVE.n - s
  return { r, s }
}

export declare namespace WebCryptoP256_sign {
  type Options = {
    /** Payload to sign. */
    payload: Hex | Bytes.Bytes
    /** ECDSA private key. */
    privateKey: CryptoKey
  }

  type ErrorType = Bytes.fromArray.ErrorType | Errors.GlobalErrorType
}

WebCryptoP256_sign.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebCryptoP256_sign.ErrorType
