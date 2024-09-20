import { Bytes_from } from '../Bytes/from.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { AesGcm_ivLength } from './constants.js'

/**
 * Decrypts encrypted data using AES-GCM.
 *
 * @example
 * ```ts twoslash
 * import { AesGcm, Bytes } from 'ox'
 *
 * const key = await AesGcm.getKey({ password: 'qwerty' })
 * const secret = Bytes.fromString('i am a secret message')
 *
 * const encrypted = await AesGcm.encrypt(secret, key)
 *
 * const decrypted = await AesGcm.decrypt(encrypted, key) // [!code focus]
 * // @log: Bytes.fromString('i am a secret message')
 * ```
 *
 * @param data - The data to encrypt.
 * @param key - The `CryptoKey` to use for encryption.
 * @returns The encrypted data.
 */
export async function AesGcm_decrypt(
  encrypted: Bytes,
  key: CryptoKey,
): Promise<Bytes> {
  const iv = encrypted.slice(0, AesGcm_ivLength)
  const data = encrypted.slice(AesGcm_ivLength)
  const decrypted = await globalThis.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    Bytes_from(data),
  )
  return new Uint8Array(decrypted)
}

export declare namespace AesGcm_decrypt {
  type ErrorType = GlobalErrorType
}

AesGcm_decrypt.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AesGcm_decrypt.ErrorType
