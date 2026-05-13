import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'

/**
 * Length of the legacy IV / salt prefix used by {@link ox#AesGcm.(encrypt:function)}
 * and {@link ox#AesGcm.(decrypt:function)}.
 *
 * @remarks
 * Existing on-disk ciphertexts produced by {@link ox#AesGcm.(encrypt:function)}
 * use a 16-byte prefix. New code that needs interop or a versioned envelope
 * should prefer {@link ox#AesGcm.(encryptEnvelope:function)} /
 * {@link ox#AesGcm.(decryptEnvelope:function)}, which use the standard 12-byte
 * AES-GCM IV.
 */
export const ivLength = 16

/**
 * Standard 12-byte AES-GCM IV length used by the new envelope helpers
 * {@link ox#AesGcm.(encryptEnvelope:function)} /
 * {@link ox#AesGcm.(decryptEnvelope:function)}.
 */
export const ivLengthV1 = 12

/** Version byte prepended to envelopes produced by {@link ox#AesGcm.(encryptEnvelope:function)}. */
export const envelopeVersion = 0x01

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
 * @param value - The data to encrypt.
 * @param key - The `CryptoKey` to use for encryption.
 * @param options - Decryption options.
 * @returns The decrypted data.
 */
export async function decrypt<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  value: value | Bytes.Bytes | Hex.Hex,
  key: CryptoKey,
  options: decrypt.Options<as> = {},
): Promise<decrypt.ReturnType<as>> {
  const { as = typeof value === 'string' ? 'Hex' : 'Bytes' } = options
  const encrypted = Bytes.from(value)
  const iv = encrypted.slice(0, ivLength)
  const data = encrypted.slice(ivLength)
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

export declare namespace decrypt {
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
export async function encrypt<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Bytes' | 'Hex' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  value: value | Bytes.Bytes | Hex.Hex,
  key: CryptoKey,
  options: encrypt.Options<as> = {},
): Promise<encrypt.ReturnType<as>> {
  const { as = typeof value === 'string' ? 'Hex' : 'Bytes' } = options
  const iv = Bytes.random(ivLength)
  const encrypted = await globalThis.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    Bytes.from(value),
  )
  // Write IV and ciphertext into a single output buffer to avoid an extra
  // allocation and copy from `Bytes.concat(iv, ciphertext)`.
  const result = new Uint8Array(ivLength + encrypted.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(encrypted), ivLength)
  if (as === 'Bytes') return result as never
  return Hex.from(result) as never
}

export declare namespace encrypt {
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
export async function getKey(options: getKey.Options): Promise<CryptoKey> {
  const { iterations = 900_000, password, salt = randomSalt(32) } = options
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

export declare namespace getKey {
  type Options = {
    /** The number of iterations to use. @default 900_000 */
    iterations?: number | undefined
    /** Password to derive key from. */
    password: string
    /** Salt to use for key derivation. @default `AesGcm.randomSalt(32)` */
    salt?: Bytes.Bytes | undefined
  }

  type ErrorType = Errors.GlobalErrorType
}

/**
 * Generates a random salt of the specified size.
 *
 * @example
 * ```ts twoslash
 * import { AesGcm } from 'ox'
 *
 * const salt = AesGcm.randomSalt()
 * // @log: Uint8Array [123, 79, 183, 167, 163, 136, 136, 16, 168, 126, 13, 165, 170, 166, 136, 136, 16, 168, 126, 13, 165, 170, 166, 136, 136, 16, 168, 126, 13, 165, 170, 166]
 * ```
 *
 * @param size - The size of the salt to generate. Defaults to `32`.
 * @returns A random salt of the specified size.
 */
export function randomSalt(size = 32): Bytes.Bytes {
  return Bytes.random(size)
}

export declare namespace randomSalt {
  type ErrorType = Bytes.random.ErrorType | Errors.GlobalErrorType
}

/**
 * Derives an AES-GCM key from a password using PBKDF2 and returns the key
 * along with the salt and iteration count used to derive it.
 *
 * @remarks
 * Prefer this helper over {@link ox#AesGcm.(getKey:function)} when callers may
 * later need to re-derive the same key (for example, after a process restart):
 * {@link ox#AesGcm.(getKey:function)} silently generates a random salt that is
 * not returned, which makes the derived key unrecoverable without an
 * out-of-band salt store.
 *
 * @example
 * ```ts twoslash
 * import { AesGcm } from 'ox'
 *
 * const { key, salt, iterations } = await AesGcm.deriveKey({
 *   password: 'correct-horse-battery-staple',
 * })
 *
 * // Persist `salt` (and `iterations`) alongside the ciphertext so that the
 * // same key can be re-derived later.
 * const sameKey = await AesGcm.deriveKey({
 *   password: 'correct-horse-battery-staple',
 *   salt,
 *   iterations,
 * })
 * ```
 *
 * @param options - Options for key derivation.
 * @returns The derived key, the salt used, and the iteration count.
 */
export async function deriveKey(
  options: deriveKey.Options,
): Promise<deriveKey.ReturnType> {
  const { iterations = 900_000, password, salt = randomSalt(32) } = options
  const key = await getKey({ iterations, password, salt })
  return { key, salt, iterations }
}

export declare namespace deriveKey {
  type Options = getKey.Options

  type ReturnType = {
    /** Derived AES-GCM key. */
    key: CryptoKey
    /** Salt used for derivation. */
    salt: Bytes.Bytes
    /** Iteration count used for derivation. */
    iterations: number
  }

  type ErrorType = getKey.ErrorType | Errors.GlobalErrorType
}

/**
 * Encrypts data using AES-GCM and writes a self-describing envelope.
 *
 * @remarks
 * The output is `version (1 byte) || iv (12 bytes) || ciphertext||tag`.
 * Use the standard 12-byte AES-GCM IV (the interoperability fast path) and
 * a leading version byte so future envelope formats can be added without
 * ambiguous decryption.
 *
 * Existing on-disk ciphertexts produced by {@link ox#AesGcm.(encrypt:function)}
 * (which use a 16-byte prefix) remain decryptable via
 * {@link ox#AesGcm.(decrypt:function)}.
 *
 * @example
 * ```ts twoslash
 * import { AesGcm, Hex } from 'ox'
 *
 * const key = await AesGcm.getKey({ password: 'correct-horse-battery-staple' })
 *
 * const envelope = await AesGcm.encryptEnvelope( // [!code focus]
 *   Hex.fromString('hello'), // [!code focus]
 *   key, // [!code focus]
 * ) // [!code focus]
 *
 * const decoded = await AesGcm.decryptEnvelope(envelope, key)
 * // @log: Hex.fromString('hello')
 * ```
 *
 * @param value - The data to encrypt.
 * @param key - The `CryptoKey` to use for encryption.
 * @param options - Encryption options.
 * @returns The versioned envelope (defaults to `Hex`).
 */
export async function encryptEnvelope<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Bytes' | 'Hex' = 'Hex',
>(
  value: value | Bytes.Bytes | Hex.Hex,
  key: CryptoKey,
  options: encryptEnvelope.Options<as> = {},
): Promise<encryptEnvelope.ReturnType<as>> {
  const { as = 'Hex' } = options
  const iv = Bytes.random(ivLengthV1)
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    Bytes.from(value),
  )
  const out = new Uint8Array(1 + ivLengthV1 + encrypted.byteLength)
  out[0] = envelopeVersion
  out.set(iv, 1)
  out.set(new Uint8Array(encrypted), 1 + ivLengthV1)
  if (as === 'Bytes') return out as never
  return Hex.from(out) as never
}

export declare namespace encryptEnvelope {
  type Options<as extends 'Bytes' | 'Hex' = 'Hex'> = {
    /** The output format. @default 'Hex' */
    as?: as | 'Bytes' | 'Hex' | undefined
  }

  type ReturnType<as extends 'Bytes' | 'Hex' = 'Bytes' | 'Hex'> =
    | (as extends 'Bytes' ? Bytes.Bytes : never)
    | (as extends 'Hex' ? Hex.Hex : never)

  type ErrorType =
    | Bytes.from.ErrorType
    | Bytes.random.ErrorType
    | Hex.from.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Decrypts a self-describing envelope produced by
 * {@link ox#AesGcm.(encryptEnvelope:function)}.
 *
 * @example
 * ```ts twoslash
 * import { AesGcm, Hex } from 'ox'
 *
 * const key = await AesGcm.getKey({ password: 'correct-horse-battery-staple' })
 * const envelope = await AesGcm.encryptEnvelope(Hex.fromString('hello'), key)
 *
 * const decoded = await AesGcm.decryptEnvelope(envelope, key) // [!code focus]
 * ```
 *
 * @param value - The envelope to decrypt.
 * @param key - The `CryptoKey` to use for decryption.
 * @param options - Decryption options.
 * @returns The decrypted data.
 */
export async function decryptEnvelope<
  value extends Hex.Hex | Bytes.Bytes,
  as extends 'Hex' | 'Bytes' =
    | (value extends Hex.Hex ? 'Hex' : never)
    | (value extends Bytes.Bytes ? 'Bytes' : never),
>(
  value: value | Bytes.Bytes | Hex.Hex,
  key: CryptoKey,
  options: decryptEnvelope.Options<as> = {},
): Promise<decryptEnvelope.ReturnType<as>> {
  const { as = typeof value === 'string' ? 'Hex' : 'Bytes' } = options
  const envelope = Bytes.from(value)
  if (envelope.length < 1 + ivLengthV1)
    throw new InvalidEnvelopeError('envelope is too short.')
  const version = envelope[0]
  if (version !== envelopeVersion)
    throw new InvalidEnvelopeError(
      `unsupported envelope version: ${version}.`,
    )
  const iv = envelope.subarray(1, 1 + ivLengthV1)
  const data = envelope.subarray(1 + ivLengthV1)
  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  )
  const result = new Uint8Array(decrypted)
  if (as === 'Bytes') return result as never
  return Hex.from(result) as never
}

export declare namespace decryptEnvelope {
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
    | InvalidEnvelopeError
    | Errors.GlobalErrorType
}

/**
 * Thrown when {@link ox#AesGcm.(decryptEnvelope:function)} is given an envelope
 * that is too short or has an unsupported version byte.
 */
export class InvalidEnvelopeError extends Errors.BaseError {
  override readonly name = 'AesGcm.InvalidEnvelopeError'

  constructor(message: string) {
    super(`AesGcm.decryptEnvelope: ${message}`)
  }
}
