import { ctr } from '@noble/ciphers/aes'
import {
  pbkdf2Async as pbkdf2Async_noble,
  pbkdf2 as pbkdf2_noble,
} from '@noble/hashes/pbkdf2'
import {
  scryptAsync as scryptAsync_noble,
  scrypt as scrypt_noble,
} from '@noble/hashes/scrypt'
import { sha256 } from '@noble/hashes/sha2'
import * as Bytes from './Bytes.js'
import type * as Errors from './Errors.js'
import * as Hash from './Hash.js'
import type * as Hex from './Hex.js'
import type { OneOf } from './internal/types.js'

/** Base Key. */
type BaseKey<
  kdf extends string = string,
  kdfparams extends Record<string, unknown> = Record<string, unknown>,
> = {
  iv: Bytes.Bytes
  key: () => string
  kdfparams: kdfparams
  kdf: kdf
}

/** Keystore. */
export type Keystore = {
  crypto: {
    cipher: 'aes-128-ctr'
    ciphertext: string
    cipherparams: {
      iv: string
    }
    mac: string
  } & Pick<Key, 'kdf' | 'kdfparams'>
  id: string
  version: 3
}

/** Key. */
export type Key = Pbkdf2Key | ScryptKey

/** PBKDF2 Key. */
export type Pbkdf2Key = BaseKey<
  'pbkdf2',
  {
    c: number
    dklen: number
    prf: 'hmac-sha256'
    salt: string
  }
>

/** Scrypt Key. */
export type ScryptKey = BaseKey<
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
 * @param keystore - Keystore to decrypt.
 * @param key - Key to use for decryption.
 * @returns Decrypted value.
 */
export async function decrypt<as extends 'Hex' | 'Bytes' = 'Hex'>(
  keystore: Keystore,
  key: Key,
  options: decrypt.Options<as> = {},
): Promise<decrypt.ReturnType<as>> {
  const { as = 'Hex' } = options
  const key_ = Bytes.from(`0x${key.key()}`)

  const encKey = Bytes.slice(key_, 0, 16)
  const macKey = Bytes.slice(key_, 16, 32)

  const ciphertext = Bytes.from(`0x${keystore.crypto.ciphertext}`)
  const mac = Hash.keccak256(Bytes.concat(macKey, ciphertext))

  if (!Bytes.isEqual(mac, Bytes.from(`0x${keystore.crypto.mac}`)))
    throw new Error('corrupt keystore')

  const data = ctr(encKey, key.iv).decrypt(ciphertext)

  if (as === 'Hex') return Bytes.toHex(data) as never
  return data as never
}

export declare namespace decrypt {
  type Options<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> = {
    /** Output format. @default 'Hex' */
    as?: as | 'Hex' | 'Bytes' | undefined
  }

  type ReturnType<as extends 'Hex' | 'Bytes' = 'Hex' | 'Bytes'> =
    | (as extends 'Hex' ? Hex.Hex : never)
    | (as extends 'Bytes' ? Bytes.Bytes : never)
}

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
  key: Key,
  options: encrypt.Options = {},
): Promise<Keystore> {
  const { id = crypto.randomUUID() } = options

  const key_ = Bytes.from(`0x${key.key()}`)
  const value_ = Bytes.from(value)

  const encKey = Bytes.slice(key_, 0, 16)
  const macKey = Bytes.slice(key_, 16, 32)

  const ciphertext = ctr(encKey, key.iv).encrypt(value_)
  const mac = Hash.keccak256(Bytes.concat(macKey, ciphertext))

  return {
    crypto: {
      cipher: 'aes-128-ctr',
      ciphertext: Bytes.toHex(ciphertext).slice(2),
      cipherparams: { iv: Bytes.toHex(key.iv).slice(2) },
      kdf: key.kdf,
      kdfparams: key.kdfparams,
      mac: Bytes.toHex(mac).slice(2),
    } as Keystore['crypto'],
    id,
    version: 3,
  }
}

export declare namespace encrypt {
  type Options = {
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
  const { iv, iterations = 262_144, password } = options

  const salt = options.salt ? Bytes.from(options.salt) : Bytes.random(32)
  const key = Bytes.toHex(
    pbkdf2_noble(sha256, password, salt, { c: iterations, dkLen: 32 }),
  ).slice(2)

  return defineKey({
    iv,
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
    /** The counter to use for the AES-CTR encryption. */
    iv?: Bytes.Bytes | Hex.Hex | undefined
    /** The number of iterations to use. @default 262_144 */
    iterations?: number | undefined
    /** Password to derive key from. */
    password: string
    /** Salt to use for key derivation. @default `Bytes.random(32)` */
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
  const { iv, iterations = 262_144, password } = options

  const salt = options.salt ? Bytes.from(options.salt) : Bytes.random(32)
  const key = Bytes.toHex(
    await pbkdf2Async_noble(sha256, password, salt, {
      c: iterations,
      dkLen: 32,
    }),
  ).slice(2)

  return defineKey({
    iv,
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
  const { iv, n = 262_144, password } = options

  const p = 8
  const r = 1

  const salt = options.salt ? Bytes.from(options.salt) : Bytes.random(32)
  const key = Bytes.toHex(
    scrypt_noble(password, salt, { N: n, dkLen: 32, r, p }),
  ).slice(2)

  return defineKey({
    iv,
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
    /** The counter to use for the AES-CTR encryption. */
    iv?: Bytes.Bytes | Hex.Hex | undefined
    /** Cost factor. @default 262_144 */
    n?: number | undefined
    /** Password to derive key from. */
    password: string
    /** Salt to use for key derivation. @default `Bytes.random(32)` */
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
  const { iv, n = 262_144, password } = options

  const p = 8
  const r = 1

  const salt = options.salt ? Bytes.from(options.salt) : Bytes.random(32)
  const key = Bytes.toHex(
    await scryptAsync_noble(password, salt, { N: n, dkLen: 32, r, p }),
  ).slice(2)

  return defineKey({
    iv,
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

///////////////////////////////////////////////////////////////////////////

/** @internal */
function defineKey<const key extends defineKey.Value>(
  key: key,
): key & { iv: Bytes.Bytes } {
  const iv = key.iv ? Bytes.from(key.iv) : Bytes.random(16)
  return { ...key, iv }
}

/** @internal */
declare namespace defineKey {
  type Value<
    kdf extends string = string,
    kdfparams extends Record<string, unknown> = Record<string, unknown>,
  > = Omit<BaseKey<kdf, kdfparams>, 'iv'> & {
    iv?: Bytes.Bytes | Hex.Hex | undefined
  }

  type ErrorType = Errors.GlobalErrorType
}
