import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'

/**
 * Generates an ECDSA P256 key pair that includes:
 *
 * - a `privateKey` of type [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey)
 *
 * - a `publicKey` of type {@link ox#Hex.Hex} or {@link ox#Bytes.Bytes}
 *
 * @example
 * ```ts twoslash
 * import { WebCryptoP256 } from 'ox'
 *
 * const { publicKey, privateKey } = await WebCryptoP256.createKeyPair()
 * // @log: {
 * // @log:   privateKey: CryptoKey {},
 * // @log:   publicKey: '0x0401188da8012335df6d36c9c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9ba3e3f1f0c854cd1b17a81a538327af927da3eaaba2223114314141dead'
 * // @log: }
 * ```
 *
 * @param options - Options for creating the key pair.
 * @returns The key pair.
 */
export async function WebCryptoP256_createKeyPair<
  as extends 'Hex' | 'Bytes' = 'Hex',
>(
  options: WebCryptoP256_createKeyPair.Options<as> = {},
): Promise<WebCryptoP256_createKeyPair.ReturnType<as>> {
  const { as = 'Hex', extractable = false } = options
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
  const publicKey = new Uint8Array(publicKey_raw)
  return {
    privateKey: keypair.privateKey,
    publicKey: as === 'Hex' ? Hex_from(publicKey) : publicKey,
  } as never
}

export declare namespace WebCryptoP256_createKeyPair {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    /** Format of the public key. @default 'Hex'*/
    as?: as | 'Hex' | 'Bytes' | undefined
    /** A boolean value indicating whether it will be possible to export the private key using `globalThis.crypto.subtle.exportKey()`. */
    extractable?: boolean | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex'> = {
    privateKey: CryptoKey
    publicKey: as extends 'Hex' ? Hex : Bytes
  }

  type ErrorType = GlobalErrorType
}

WebCryptoP256_createKeyPair.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as WebCryptoP256_createKeyPair.ErrorType
