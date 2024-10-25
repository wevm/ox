import type * as AesGcm from '../../AesGcm.js'
import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import { AesGcm_ivLength } from './constants.js'

/**
 * Decrypts encrypted data using AES-GCM.
 *
 * @example
 * ```ts twoslash
 * import { AesGcm, Hex } from 'ox'
 *
 * const key = await AesGcm.getKey({ password: 'qwerty' })
 * const secret = Hex.fromString('i am a secret message')
 *
 * const encrypted = await AesGcm.encrypt(secret, key)
 *
 * const decrypted = await AesGcm.decrypt(encrypted, key) // [!code focus]
 * // @log: Hex.fromString('i am a secret message')
 * ```
 *
 * @param data - The data to encrypt.
 * @param key - The `CryptoKey` to use for encryption.
 * @param options - Decryption options.
 * @returns The decrypted data.
 */
export async function AesGcm_decrypt<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  value: value | Bytes.Bytes | Hex.Hex,
  key: CryptoKey,
  options: AesGcm.decrypt.Options<as> = {},
): Promise<AesGcm.decrypt.ReturnType<as>> {
  const { as = typeof value === 'string' ? 'Hex' : 'Bytes' } = options
  const encrypted = Bytes.from(value)
  const iv = encrypted.slice(0, AesGcm_ivLength)
  const data = encrypted.slice(AesGcm_ivLength)
  const decrypted = await globalThis.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    Bytes.from(data),
  )
  const result = new Uint8Array(decrypted)
  if (as === 'Bytes') return result as never
  return Hex.from(result) as never
}

export declare namespace AesGcm_decrypt {
  type Options<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> = {
    /** The output format. @default 'Bytes' */
    as?: as | 'Bytes' | 'Hex' | undefined
  }

  type ReturnType<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Hex.from.ErrorType
    | Errors.GlobalErrorType
}

AesGcm_decrypt.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AesGcm.decrypt.ErrorType
