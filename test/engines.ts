import { ctr } from '@noble/ciphers/aes.js'
import { ed25519, x25519 } from '@noble/curves/ed25519.js'
import { p256 } from '@noble/curves/nist.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { blake3 } from '@noble/hashes/blake3.js'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 } from '@noble/hashes/legacy.js'
import { pbkdf2, pbkdf2Async } from '@noble/hashes/pbkdf2.js'
import { scrypt, scryptAsync } from '@noble/hashes/scrypt.js'
import { sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { mnemonicToSeedSync } from '@scure/bip39'
import type { Engine } from 'ox'

/**
 * An engine whose every slot delegates to the same `@noble/*` implementation ox
 * uses by default.
 *
 * Installing it must not change a single result. That is what makes it useful:
 * it exercises every slot's byte conventions -- 65-byte recovered signatures,
 * uncompressed public keys, compressed shared secrets -- against the code that
 * consumes them. A contract that disagrees with what ox expects fails here
 * rather than silently only when a real engine is installed.
 */
export const identity: Engine.Engine = {
  Ed25519: {
    getPublicKey: (privateKey) => ed25519.getPublicKey(privateKey),
    randomSecretKey: () => ed25519.utils.randomSecretKey(),
    sign: (payload, privateKey) => ed25519.sign(payload, privateKey),
    toMontgomery: (publicKey) => ed25519.utils.toMontgomery(publicKey),
    toMontgomerySecret: (privateKey) =>
      ed25519.utils.toMontgomerySecret(privateKey),
    verify: (signature, payload, publicKey) =>
      ed25519.verify(signature, payload, publicKey),
  },
  Hash: {
    blake3: (input) => blake3(input),
    hmacSha256: (key, message) => hmac(sha256, key, message),
    keccak256: (input) => keccak_256(input),
    ripemd160: (input) => ripemd160(input),
    sha256: (input) => sha256(input),
  },
  Keystore: {
    aesCtrDecrypt: (key, iv, data) => ctr(key, iv).decrypt(data),
    aesCtrEncrypt: (key, iv, data) => ctr(key, iv).encrypt(data),
    pbkdf2Sha256: (password, salt, options) =>
      pbkdf2(sha256, password, salt, options),
    pbkdf2Sha256Async: (password, salt, options) =>
      pbkdf2Async(sha256, password, salt, options),
    scrypt: (password, salt, options) => scrypt(password, salt, options),
    scryptAsync: (password, salt, options) =>
      scryptAsync(password, salt, options),
  },
  Mnemonic: {
    toSeed: (mnemonic, passphrase) => mnemonicToSeedSync(mnemonic, passphrase),
  },
  P256: {
    getPublicKey: (privateKey) => p256.getPublicKey(privateKey, false),
    getSharedSecret: (privateKey, publicKey) =>
      p256.getSharedSecret(privateKey, publicKey, true),
    randomSecretKey: () => p256.utils.randomSecretKey(),
    recoverPublicKey: (signature, payload) =>
      p256.Signature.fromBytes(signature, 'recovered')
        .recoverPublicKey(payload)
        .toBytes(false),
    sign: (payload, privateKey, options) =>
      p256.sign(payload, privateKey, {
        ...options,
        format: 'recovered',
        lowS: true,
      }),
    verify: (signature, payload, publicKey, options) =>
      p256.verify(signature, payload, publicKey, { ...options, lowS: true }),
  },
  Secp256k1: {
    getPublicKey: (privateKey) => secp256k1.getPublicKey(privateKey, false),
    getSharedSecret: (privateKey, publicKey) =>
      secp256k1.getSharedSecret(privateKey, publicKey, true),
    randomSecretKey: () => secp256k1.utils.randomSecretKey(),
    recoverPublicKey: (signature, payload) =>
      secp256k1.Signature.fromBytes(signature, 'recovered')
        .recoverPublicKey(payload)
        .toBytes(false),
    sign: (payload, privateKey, options) =>
      secp256k1.sign(payload, privateKey, {
        ...options,
        format: 'recovered',
        lowS: true,
      }),
    verify: (signature, payload, publicKey, options) =>
      secp256k1.verify(signature, payload, publicKey, {
        ...options,
        lowS: true,
      }),
  },
  X25519: {
    getPublicKey: (privateKey) => x25519.getPublicKey(privateKey),
    getSharedSecret: (privateKey, publicKey) =>
      x25519.getSharedSecret(privateKey, publicKey),
    randomSecretKey: () => x25519.utils.randomSecretKey(),
  },
}

/**
 * An engine whose every slot returns a fixed, wrong answer.
 *
 * Used to prove a call site actually consults the engine. If a result is
 * unchanged after installing this, ox reached its default implementation
 * directly and that slot is not wired up.
 */
export const sentinel: Engine.Engine = {
  Ed25519: {
    getPublicKey: () => new Uint8Array(32).fill(0xe1),
    sign: () => new Uint8Array(64).fill(0xe2),
    verify: () => false,
  },
  Hash: {
    blake3: () => new Uint8Array(32).fill(0xb1),
    hmacSha256: () => new Uint8Array(32).fill(0xb2),
    keccak256: () => new Uint8Array(32).fill(0xb3),
    ripemd160: () => new Uint8Array(20).fill(0xb4),
    sha256: () => new Uint8Array(32).fill(0xb5),
  },
  Keystore: {
    pbkdf2Sha256: () => new Uint8Array(32).fill(0xc1),
    scrypt: () => new Uint8Array(32).fill(0xc2),
  },
  Mnemonic: {
    toSeed: () => new Uint8Array(64).fill(0xd1),
  },
  X25519: {
    getPublicKey: () => new Uint8Array(32).fill(0xf1),
    getSharedSecret: () => new Uint8Array(32).fill(0xf2),
  },
}
