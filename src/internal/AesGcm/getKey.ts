import * as AesGcm from '../../AesGcm.js'
import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'

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
  options: AesGcm.getKey.Options,
): Promise<CryptoKey> {
  const {
    iterations = 900_000,
    password,
    salt = AesGcm.randomSalt(32),
  } = options
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    Bytes.fromString(password),
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
  interface Options {
    /** The number of iterations to use. @default 900_000 */
    iterations?: number | undefined
    /** Password to derive key from. */
    password: string
    /** Salt to use for key derivation. @default `AesGcm.randomSalt(32)` */
    salt?: Bytes.Bytes | undefined
  }

  type ErrorType = Bytes.fromString.ErrorType | Errors.GlobalErrorType
}

AesGcm_getKey.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AesGcm.getKey.ErrorType
