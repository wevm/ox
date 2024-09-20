import { Bytes_concat } from '../Bytes/concat.js'
import { Bytes_from } from '../Bytes/from.js'
import { Bytes_random } from '../Bytes/random.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { AesGcm_ivLength } from './constants.js'

/**
 * Encrypts data using AES-GCM.
 *
 * @example
 * ```ts twoslash
 * import { AesGcm, Bytes } from 'ox'
 *
 * const key = await AesGcm.getKey({ password: 'qwerty' })
 * const secret = Bytes.fromString('i am a secret message')
 *
 * const encrypted = await AesGcm.encrypt(secret, key) // [!code focus]
 * // @log: Uint8Array [123, 79, 183, 167, 163, 136, 136, 16, 168, 126, 13, 165, 170, 166, 136, 136, 16, 168, 126, 13, 165, 170, 166, 136, 136, 16, 168, 126, 13, 165, 170, 166]
 * ```
 *
 * @param data - The data to encrypt.
 * @param key - The `CryptoKey` to use for encryption.
 * @returns The encrypted data.
 */
export async function AesGcm_encrypt(
  data: Bytes,
  key: CryptoKey,
): Promise<Bytes> {
  const iv = Bytes_random(AesGcm_ivLength)
  const encrypted = await globalThis.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    Bytes_from(data),
  )
  return Bytes_concat(iv, new Uint8Array(encrypted))
}

export declare namespace AesGcm_encrypt {
  type ErrorType = GlobalErrorType
}

AesGcm_encrypt.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AesGcm_encrypt.ErrorType
