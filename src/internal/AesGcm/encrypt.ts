import type { Errors } from '../../Errors.js'
import { Bytes_concat } from '../Bytes/concat.js'
import { Bytes_from } from '../Bytes/from.js'
import { Bytes_random } from '../Bytes/random.js'
import type { Bytes } from '../Bytes/types.js'
import { Hex_from } from '../Hex/from.js'
import type { Hex } from '../Hex/types.js'
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
 * @param value - The data to encrypt.
 * @param key - The `CryptoKey` to use for encryption.
 * @param options - Encryption options.
 * @returns The encrypted data.
 */
export async function AesGcm_encrypt<
  value extends Hex | Bytes,
  as extends 'Bytes' | 'Hex' =
    | (value extends Hex ? 'Hex' : never)
    | (value extends Bytes ? 'Bytes' : never),
>(
  value: value | Bytes | Hex,
  key: CryptoKey,
  options: AesGcm_encrypt.Options<as> = {},
): Promise<AesGcm_encrypt.ReturnType<as>> {
  const { as = typeof value === 'string' ? 'Hex' : 'Bytes' } = options
  const iv = Bytes_random(AesGcm_ivLength)
  const encrypted = await globalThis.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    Bytes_from(value),
  )
  const result = Bytes_concat(iv, new Uint8Array(encrypted))
  if (as === 'Bytes') return result as never
  return Hex_from(result) as never
}

export declare namespace AesGcm_encrypt {
  type Options<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> = {
    /** The output format. @default 'Hex' */
    as?: as | 'Bytes' | 'Hex' | undefined
  }

  type ReturnType<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> =
    | (as extends 'Bytes' ? Bytes : never)
    | (as extends 'Hex' ? Hex : never)

  type ErrorType =
    | Bytes_concat.ErrorType
    | Bytes_from.ErrorType
    | Bytes_random.ErrorType
    | Hex_from.ErrorType
    | Errors.GlobalErrorType
}

AesGcm_encrypt.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as AesGcm_encrypt.ErrorType
