import { Bytes_fromString } from '../Bytes/fromString.js'
import type { Bytes } from '../Bytes/types.js'
import type { GlobalErrorType } from '../Errors/error.js'
import { AesGcm_randomSalt } from './randomSalt.js'

/**
 * Derives an AES-GCM key from a password using PBKDF2.
 *
 * @example
 * ```ts twoslash
 * import { AesGcm } from 'ox'
 *
 * const key = await AesGcm.getKey({ password: 'qwerty' })
 * // @log: CryptoKey {}
 * ```
 *
 * @param options - Options for key derivation.
 * @returns The derived key.
 */
export async function AesGcm_getKey(
  options: AesGcm_getKey.Options,
): Promise<CryptoKey> {
  const {
    iterations = 900_000,
    password,
    salt = AesGcm_randomSalt(32),
  } = options
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    Bytes_fromString(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  )
  const key = await globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
  return key
}

export declare namespace AesGcm_getKey {
  type Options = {
    /** The number of iterations to use. @default 900_000 */
    iterations?: number | undefined
    /** Password to derive key from. */
    password: string
    /** Salt to use for key derivation. @default `AesGcm.randomSalt(32)` */
    salt?: Bytes | undefined
  }

  type ErrorType = GlobalErrorType
}

AesGcm_getKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AesGcm_getKey.ErrorType
