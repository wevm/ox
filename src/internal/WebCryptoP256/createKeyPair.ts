import type { Errors } from '../../Errors.js'
import { PublicKey_from } from '../PublicKey/from.js'
import type { PublicKey } from '../PublicKey/types.js'
import type { Compute } from '../types.js'

/**
 * Generates an ECDSA P256 key pair that includes:
 *
 * - a `privateKey` of type [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey)
 *
 * - a `publicKey` of type {@link ox#(Hex:type)} or {@link ox#Bytes.Bytes}
 *
 * @example
 * ```ts twoslash
 * import { WebCryptoP256 } from 'ox'
 *
 * const { publicKey, privateKey } = await WebCryptoP256.createKeyPair()
 * // @log: {
 * // @log:   privateKey: CryptoKey {},
 * // @log:   publicKey: {
 * // @log:     x: 59295962801117472859457908919941473389380284132224861839820747729565200149877n,
 * // @log:     y: 24099691209996290925259367678540227198235484593389470330605641003500238088869n,
 * // @log:     prefix: 4,
 * // @log:   },
 * // @log: }
 * ```
 *
 * @param options - Options for creating the key pair.
 * @returns The key pair.
 */
export async function WebCryptoP256_createKeyPair(
  options: WebCryptoP256_createKeyPair.Options = {},
): Promise<WebCryptoP256_createKeyPair.ReturnType> {
  const { extractable = false } = options
  const keypair = await globalThis.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    extractable,
    ['sign', 'verify'],
  )
  const publicKey_raw = await globalThis.crypto.subtle.exportKey(
    'raw',
    keypair.publicKey,
  )
  const publicKey = PublicKey_from(new Uint8Array(publicKey_raw))
  return {
    privateKey: keypair.privateKey,
    publicKey,
  }
}

export declare namespace WebCryptoP256_createKeyPair {
  type Options = {
    /** A boolean value indicating whether it will be possible to export the private key using `globalThis.crypto.subtle.exportKey()`. */
    extractable?: boolean | undefined
  }

  type ReturnType = Compute<{
    privateKey: CryptoKey
    publicKey: PublicKey
  }>

  type ErrorType = Errors.GlobalErrorType
}

WebCryptoP256_createKeyPair.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebCryptoP256_createKeyPair.ErrorType
