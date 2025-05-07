import { ctr } from '@noble/ciphers/aes'
import {
  pbkdf2 as pbkdf2_noble,
  pbkdf2Async as pbkdf2Async_noble,
} from '@noble/hashes/pbkdf2'
import {
  scrypt as scrypt_noble,
  scryptAsync as scryptAsync_noble,
} from '@noble/hashes/scrypt'
import { sha256 } from '@noble/hashes/sha2'
import * as Bytes from './Bytes.js'
import type * as Hex from './Hex.js'
import * as Hash from './Hash.js'
import type * as Errors from './Errors.js'

/** PBKDF2 Key. */
export type Pbkdf2Key = defineKey.Key<
  'pbkdf2',
  {
    c: number
    dklen: number
    prf: 'hmac-sha256'
    salt: string
  }
>

/** Scrypt Key. */
export type ScryptKey = defineKey.Key<
  'scrypt',
  {
    dklen: number
    n: number
    p: number
    r: number
    salt: string
  }
>

/**
 * TODO
 *
 * @example
 * TODO
 *
 * @param value - Value to encrypt.
 * @param key - Key to use for encryption.
 * @param options - Encryption options.
 * @returns Encrypted keystore.
 */
export async function encrypt(
  value: Bytes.Bytes | Hex.Hex,
  key: Pbkdf2Key | ScryptKey,
  options: encrypt.Options = {},
) {
  const { id = crypto.randomUUID() } = options

  const iv = options.iv ? Bytes.from(options.iv) : Bytes.random(16)

  const key_ = Bytes.from(`0x${key.key()}`)
  const value_ = Bytes.from(value)

  const encKey = Bytes.slice(key_, 0, 16)
  const ciphertext = ctr(encKey, iv).encrypt(value_)

  const macKey = Bytes.slice(key_, 16, 32)
  const mac = Hash.keccak256(Bytes.concat(macKey, ciphertext))

  return {
    crypto: {
      cipher: 'aes-128-ctr',
      ciphertext: Bytes.toHex(ciphertext).slice(2),
      cipherparams: { iv: Bytes.toHex(iv).slice(2) },
      kdf: key.kdf,
      kdfparams: key.kdfparams,
      mac: Bytes.toHex(mac).slice(2),
    },
    id,
    version: 3,
  }
}

export declare namespace encrypt {
  type Options = {
    /** The counter to use for the AES-CTR encryption. */
    iv?: Bytes.Bytes | Hex.Hex | undefined
    /** UUID. */
    id?: string | undefined
  }
}

/**
 * TODO
 *
 * @example
 * TODO
 *
 * @param options - PBKDF2 options.
 * @returns PBKDF2 key.
 */
export function pbkdf2(options: pbkdf2.Options) {
  const { iterations = 262_144, password } = options

  const salt = options.salt ? Bytes.from(options.salt) : randomSalt(32)
  const key = Bytes.toHex(
    pbkdf2_noble(sha256, password, salt, { c: iterations, dkLen: 32 }),
  ).slice(2)

  return defineKey({
    key: () => key,
    kdfparams: {
      c: iterations,
      dklen: 32,
      prf: 'hmac-sha256',
      salt: Bytes.toHex(salt).slice(2),
    },
    kdf: 'pbkdf2',
  }) satisfies Pbkdf2Key
}

export declare namespace pbkdf2 {
  type Options = {
    /** The number of iterations to use. @default 262_144 */
    iterations?: number | undefined
    /** Password to derive key from. */
    password: string
    /** Salt to use for key derivation. @default `Keystore.randomSalt(32)` */
    salt?: Bytes.Bytes | Hex.Hex | undefined
  }
}

/**
 * TODO
 *
 * @example
 * TODO
 *
 * @param options - PBKDF2 options.
 * @returns PBKDF2 key.
 */
export async function pbkdf2Async(options: pbkdf2.Options) {
  const { iterations = 262_144, password } = options

  const salt = options.salt ? Bytes.from(options.salt) : randomSalt(32)
  const key = Bytes.toHex(
    await pbkdf2Async_noble(sha256, password, salt, {
      c: iterations,
      dkLen: 32,
    }),
  ).slice(2)

  return defineKey({
    key: () => key,
    kdfparams: {
      c: iterations,
      dklen: 32,
      prf: 'hmac-sha256',
      salt: Bytes.toHex(salt).slice(2),
    },
    kdf: 'pbkdf2',
  }) satisfies Pbkdf2Key
}

export declare namespace pbkdf2Async {
  type Options = pbkdf2.Options
}

/**
 * TODO
 *
 * @example
 * TODO
 *
 * @param options - Scrypt options.
 * @returns Scrypt key.
 */
export function scrypt(options: scrypt.Options) {
  const { n = 262_144, password } = options

  const p = 8
  const r = 1

  const salt = options.salt ? Bytes.from(options.salt) : randomSalt(32)
  const key = Bytes.toHex(
    scrypt_noble(password, salt, { N: n, dkLen: 32, r, p }),
  ).slice(2)

  return defineKey({
    key: () => key,
    kdfparams: {
      dklen: 32,
      n,
      p,
      r,
      salt: Bytes.toHex(salt).slice(2),
    },
    kdf: 'scrypt',
  }) satisfies ScryptKey
}

export declare namespace scrypt {
  type Options = {
    /** Cost factor. @default 262_144 */
    n?: number | undefined
    /** Password to derive key from. */
    password: string
    /** Salt to use for key derivation. @default `Keystore.randomSalt(32)` */
    salt?: Bytes.Bytes | Hex.Hex | undefined
  }
}

/**
 * TODO
 *
 * @example
 * TODO
 *
 * @param options - Scrypt options.
 * @returns Scrypt key.
 */
export async function scryptAsync(options: scrypt.Options) {
  const { n = 262_144, password } = options

  const p = 8
  const r = 1

  const salt = options.salt ? Bytes.from(options.salt) : randomSalt(32)
  const key = Bytes.toHex(
    await scryptAsync_noble(password, salt, { N: n, dkLen: 32, r, p }),
  ).slice(2)

  return defineKey({
    key: () => key,
    kdfparams: {
      dklen: 32,
      n,
      p,
      r,
      salt: Bytes.toHex(salt).slice(2),
    },
    kdf: 'scrypt',
  }) satisfies ScryptKey
}

export declare namespace scryptAsync {
  type Options = scrypt.Options
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

///////////////////////////////////////////////////////////////////////////

/** @internal */
function defineKey<const key extends defineKey.Key>(key: key): key {
  return key
}

/** @internal */
declare namespace defineKey {
  type Key<
    kdf extends string = string,
    kdfparams extends Record<string, unknown> = Record<string, unknown>,
  > = {
    key: () => string
    kdfparams: kdfparams
    kdf: kdf
  }

  type ErrorType = Errors.GlobalErrorType
}
