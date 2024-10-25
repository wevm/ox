import type * as AesGcm from '../../AesGcm.js'
import * as Bytes from '../../Bytes.js'
import type * as Errors from '../../Errors.js'
import * as Hex from '../../Hex.js'
import { AesGcm_ivLength } from './constants.js'

/**
 * Encrypts data using AES-GCM.
 *
 * @example
 * ```ts twoslash
 * import { AesGcm, Hex } from 'ox'
 *
 * const key = await AesGcm.getKey({ password: 'qwerty' })
 * const secret = Hex.fromString('i am a secret message')
 *
 * const encrypted = await AesGcm.encrypt(secret, key) // [!code focus]
 * // @log: '0x5e257b25bcf53d5431e54e5a68ca0138306d31bb6154f35a97bb8ea18111e7d82bcf619d3c76c4650688bc5310eed80b8fc86d1e3e'
 * ```
 *
 * @param data - The data to encrypt.
 * @param key - The `CryptoKey` to use for encryption.
 * @param options - Encryption options.
 * @returns The encrypted data.
 */
export async function AesGcm_encrypt<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Bytes' | 'Hex' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  value: value | Bytes.Bytes | Hex.Hex,
  key: CryptoKey,
  options: AesGcm.encrypt.Options<as> = {},
): Promise<AesGcm.encrypt.ReturnType<as>> {
  const { as = typeof value === 'string' ? 'Hex' : 'Bytes' } = options
  const iv = Bytes.random(AesGcm_ivLength)
  const encrypted = await globalThis.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    Bytes.from(value),
  )
  const result = Bytes.concat(iv, new Uint8Array(encrypted))
  if (as === 'Bytes') return result as never
  return Hex.from(result) as never
}

export declare namespace AesGcm_encrypt {
  type Options<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> = {
    /** The output format. @default 'Hex' */
    as?: as | 'Bytes' | 'Hex' | undefined
  }

  type ReturnType<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.concat.ErrorType
    | Bytes.from.ErrorType
    | Bytes.random.ErrorType
    | Hex.from.ErrorType
    | Errors.GlobalErrorType
}

AesGcm_encrypt.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AesGcm.encrypt.ErrorType
