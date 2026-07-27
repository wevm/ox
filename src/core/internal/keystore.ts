import { ctr } from '@noble/ciphers/aes.js'
import {
  pbkdf2 as pbkdf2_noble,
  pbkdf2Async as pbkdf2Async_noble,
} from '@noble/hashes/pbkdf2.js'
import {
  scrypt as scrypt_noble,
  scryptAsync as scryptAsync_noble,
} from '@noble/hashes/scrypt.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { type Complete, type Keystore, overrides } from './engine.js'

/**
 * Resolvers for the `Keystore` slot, and ox's defaults for it, backed by
 * `@noble/ciphers` and `@noble/hashes`.
 *
 * Declaring the defaults against the slot contract is what keeps them honest: a
 * default that goes missing, or whose signature drifts, fails to compile rather
 * than failing at the call site.
 */

const aesCtrDecryptDefault: Complete<Keystore>['aesCtrDecrypt'] = (
  key,
  iv,
  data,
) => ctr(key, iv).decrypt(data)

const aesCtrEncryptDefault: Complete<Keystore>['aesCtrEncrypt'] = (
  key,
  iv,
  data,
) => ctr(key, iv).encrypt(data)

const pbkdf2Sha256Default: Complete<Keystore>['pbkdf2Sha256'] = (
  password,
  salt,
  options,
) => pbkdf2_noble(sha256, password, salt, options)

const pbkdf2Sha256AsyncDefault: Complete<Keystore>['pbkdf2Sha256Async'] = (
  password,
  salt,
  options,
) => pbkdf2Async_noble(sha256, password, salt, options)

const scryptDefault: Complete<Keystore>['scrypt'] = (password, salt, options) =>
  scrypt_noble(password, salt, options)

const scryptAsyncDefault: Complete<Keystore>['scryptAsync'] = (
  password,
  salt,
  options,
) => scryptAsync_noble(password, salt, options)

/** @internal */
export const aesCtrDecrypt: Complete<Keystore>['aesCtrDecrypt'] = (
  key,
  iv,
  data,
) => (overrides.Keystore?.aesCtrDecrypt ?? aesCtrDecryptDefault)(key, iv, data)

/** @internal */
export const aesCtrEncrypt: Complete<Keystore>['aesCtrEncrypt'] = (
  key,
  iv,
  data,
) => (overrides.Keystore?.aesCtrEncrypt ?? aesCtrEncryptDefault)(key, iv, data)

/** @internal */
export const pbkdf2Sha256: Complete<Keystore>['pbkdf2Sha256'] = (
  password,
  salt,
  options,
) =>
  (overrides.Keystore?.pbkdf2Sha256 ?? pbkdf2Sha256Default)(
    password,
    salt,
    options,
  )

/** @internal */
export const pbkdf2Sha256Async: Complete<Keystore>['pbkdf2Sha256Async'] = (
  password,
  salt,
  options,
) =>
  (overrides.Keystore?.pbkdf2Sha256Async ?? pbkdf2Sha256AsyncDefault)(
    password,
    salt,
    options,
  )

/** @internal */
export const scrypt: Complete<Keystore>['scrypt'] = (password, salt, options) =>
  (overrides.Keystore?.scrypt ?? scryptDefault)(password, salt, options)

/** @internal */
export const scryptAsync: Complete<Keystore>['scryptAsync'] = (
  password,
  salt,
  options,
) =>
  (overrides.Keystore?.scryptAsync ?? scryptAsyncDefault)(
    password,
    salt,
    options,
  )
