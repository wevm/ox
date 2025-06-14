import { describe, expect, test } from 'vitest'
import * as Bytes from '../Bytes.js'
import * as Hex from '../Hex.js'
import * as X25519 from '../X25519.js'

describe('noble', () => {
  test('exports noble curves x25519', () => {
    expect(X25519.noble).toBeDefined()
    expect(typeof X25519.noble.getPublicKey).toBe('function')
    expect(typeof X25519.noble.getSharedSecret).toBe('function')
    expect(typeof X25519.noble.utils.randomPrivateKey).toBe('function')
  })
})

describe('createKeyPair', () => {
  test('creates key pair with default format (Hex)', () => {
    const keyPair = X25519.createKeyPair()
    expect(keyPair.privateKey).toMatch(/^0x[0-9a-f]{64}$/i)
    expect(keyPair.publicKey).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('creates key pair with Hex format', () => {
    const keyPair = X25519.createKeyPair({ as: 'Hex' })
    expect(keyPair.privateKey).toMatch(/^0x[0-9a-f]{64}$/i)
    expect(keyPair.publicKey).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('creates key pair with Bytes format', () => {
    const keyPair = X25519.createKeyPair({ as: 'Bytes' })
    expect(keyPair.privateKey).toBeInstanceOf(Uint8Array)
    expect(keyPair.publicKey).toBeInstanceOf(Uint8Array)
    expect(keyPair.privateKey).toHaveLength(32)
    expect(keyPair.publicKey).toHaveLength(32)
  })

  test('creates different key pairs on each call', () => {
    const keyPair1 = X25519.createKeyPair()
    const keyPair2 = X25519.createKeyPair()
    expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey)
    expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey)
  })

  test('public key is derived from private key', () => {
    const keyPair = X25519.createKeyPair()
    const publicKey = X25519.getPublicKey({ privateKey: keyPair.privateKey })
    expect(publicKey).toBe(keyPair.publicKey)
  })
})

describe('getPublicKey', () => {
  test('computes public key from private key (Hex input)', () => {
    const privateKey =
      '0x7777777777777777777777777777777777777777777777777777777777777777'
    const publicKey = X25519.getPublicKey({ privateKey })
    expect(publicKey).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('computes public key from private key (Bytes input)', () => {
    const privateKey = new Uint8Array(32).fill(0x77)
    const publicKey = X25519.getPublicKey({ privateKey })
    expect(publicKey).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('returns public key in Hex format by default', () => {
    const privateKey = X25519.randomPrivateKey()
    const publicKey = X25519.getPublicKey({ privateKey })
    expect(publicKey).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('returns public key in Hex format when specified', () => {
    const privateKey = X25519.randomPrivateKey()
    const publicKey = X25519.getPublicKey({ privateKey, as: 'Hex' })
    expect(publicKey).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('returns public key in Bytes format when specified', () => {
    const privateKey = X25519.randomPrivateKey()
    const publicKey = X25519.getPublicKey({ privateKey, as: 'Bytes' })
    expect(publicKey).toBeInstanceOf(Uint8Array)
    expect(publicKey).toHaveLength(32)
  })

  test('is deterministic - same private key produces same public key', () => {
    const privateKey =
      '0x7777777777777777777777777777777777777777777777777777777777777777'
    const publicKey1 = X25519.getPublicKey({ privateKey })
    const publicKey2 = X25519.getPublicKey({ privateKey })
    expect(publicKey1).toBe(publicKey2)
  })

  test('different private keys produce different public keys', () => {
    const privateKey1 =
      '0x7777777777777777777777777777777777777777777777777777777777777777'
    const privateKey2 =
      '0x8888888888888888888888888888888888888888888888888888888888888888'
    const publicKey1 = X25519.getPublicKey({ privateKey: privateKey1 })
    const publicKey2 = X25519.getPublicKey({ privateKey: privateKey2 })
    expect(publicKey1).not.toBe(publicKey2)
  })
})

describe('getSharedSecret', () => {
  test('computes shared secret between two key pairs', () => {
    const keyPairA = X25519.createKeyPair()
    const keyPairB = X25519.createKeyPair()

    const sharedSecretA = X25519.getSharedSecret({
      privateKey: keyPairA.privateKey,
      publicKey: keyPairB.publicKey,
    })
    const sharedSecretB = X25519.getSharedSecret({
      privateKey: keyPairB.privateKey,
      publicKey: keyPairA.publicKey,
    })

    expect(sharedSecretA).toBe(sharedSecretB)
    expect(sharedSecretA).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('computes shared secret with Hex inputs', () => {
    const privateKeyA =
      '0x7777777777777777777777777777777777777777777777777777777777777777'
    const publicKeyB = X25519.getPublicKey({
      privateKey:
        '0x8888888888888888888888888888888888888888888888888888888888888888',
    })

    const sharedSecret = X25519.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    expect(sharedSecret).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('computes shared secret with Bytes inputs', () => {
    const privateKeyA = new Uint8Array(32).fill(0x77)
    const publicKeyB = X25519.getPublicKey({
      privateKey: new Uint8Array(32).fill(0x88),
    })

    const sharedSecret = X25519.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    expect(sharedSecret).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('returns shared secret in Hex format by default', () => {
    const keyPairA = X25519.createKeyPair()
    const keyPairB = X25519.createKeyPair()

    const sharedSecret = X25519.getSharedSecret({
      privateKey: keyPairA.privateKey,
      publicKey: keyPairB.publicKey,
    })

    expect(sharedSecret).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('returns shared secret in Hex format when specified', () => {
    const keyPairA = X25519.createKeyPair()
    const keyPairB = X25519.createKeyPair()

    const sharedSecret = X25519.getSharedSecret({
      privateKey: keyPairA.privateKey,
      publicKey: keyPairB.publicKey,
      as: 'Hex',
    })

    expect(sharedSecret).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('returns shared secret in Bytes format when specified', () => {
    const keyPairA = X25519.createKeyPair()
    const keyPairB = X25519.createKeyPair()

    const sharedSecret = X25519.getSharedSecret({
      privateKey: keyPairA.privateKey,
      publicKey: keyPairB.publicKey,
      as: 'Bytes',
    })

    expect(sharedSecret).toBeInstanceOf(Uint8Array)
    expect(sharedSecret).toHaveLength(32)
  })

  test('is deterministic - same inputs produce same shared secret', () => {
    const privateKeyA =
      '0x7777777777777777777777777777777777777777777777777777777777777777'
    const publicKeyB = X25519.getPublicKey({
      privateKey:
        '0x8888888888888888888888888888888888888888888888888888888888888888',
    })

    const sharedSecret1 = X25519.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })
    const sharedSecret2 = X25519.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })

    expect(sharedSecret1).toBe(sharedSecret2)
  })

  test('different key pairs produce different shared secrets', () => {
    const keyPairA = X25519.createKeyPair()
    const keyPairB = X25519.createKeyPair()
    const keyPairC = X25519.createKeyPair()

    const sharedSecretAB = X25519.getSharedSecret({
      privateKey: keyPairA.privateKey,
      publicKey: keyPairB.publicKey,
    })
    const sharedSecretAC = X25519.getSharedSecret({
      privateKey: keyPairA.privateKey,
      publicKey: keyPairC.publicKey,
    })

    expect(sharedSecretAB).not.toBe(sharedSecretAC)
  })

  test('mixed format inputs work correctly', () => {
    const privateKeyHex =
      '0x7777777777777777777777777777777777777777777777777777777777777777'
    const publicKeyBytes = X25519.getPublicKey({
      privateKey:
        '0x8888888888888888888888888888888888888888888888888888888888888888',
      as: 'Bytes',
    })

    const sharedSecret = X25519.getSharedSecret({
      privateKey: privateKeyHex,
      publicKey: publicKeyBytes,
    })

    expect(sharedSecret).toMatch(/^0x[0-9a-f]{64}$/i)
  })
})

describe('randomPrivateKey', () => {
  test('generates private key in Hex format by default', () => {
    const privateKey = X25519.randomPrivateKey()
    expect(privateKey).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('generates private key in Hex format when specified', () => {
    const privateKey = X25519.randomPrivateKey({ as: 'Hex' })
    expect(privateKey).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('generates private key in Bytes format when specified', () => {
    const privateKey = X25519.randomPrivateKey({ as: 'Bytes' })
    expect(privateKey).toBeInstanceOf(Uint8Array)
    expect(privateKey).toHaveLength(32)
  })

  test('generates different private keys on each call', () => {
    const privateKey1 = X25519.randomPrivateKey()
    const privateKey2 = X25519.randomPrivateKey()
    expect(privateKey1).not.toBe(privateKey2)
  })

  test('generated private keys are valid (can derive public keys)', () => {
    const privateKey = X25519.randomPrivateKey()
    const publicKey = X25519.getPublicKey({ privateKey })
    expect(publicKey).toMatch(/^0x[0-9a-f]{64}$/i)
  })

  test('generated private keys work for ECDH', () => {
    const privateKeyA = X25519.randomPrivateKey()
    const privateKeyB = X25519.randomPrivateKey()
    const publicKeyA = X25519.getPublicKey({ privateKey: privateKeyA })
    const publicKeyB = X25519.getPublicKey({ privateKey: privateKeyB })

    const sharedSecretA = X25519.getSharedSecret({
      privateKey: privateKeyA,
      publicKey: publicKeyB,
    })
    const sharedSecretB = X25519.getSharedSecret({
      privateKey: privateKeyB,
      publicKey: publicKeyA,
    })

    expect(sharedSecretA).toBe(sharedSecretB)
  })
})

describe('error handling', () => {
  test('handles invalid private key format', () => {
    expect(() => {
      X25519.getPublicKey({ privateKey: 'invalid' as any })
    }).toThrow()
  })

  test('handles invalid public key format in getSharedSecret', () => {
    const privateKey = X25519.randomPrivateKey()
    expect(() => {
      X25519.getSharedSecret({
        privateKey,
        publicKey: 'invalid' as any,
      })
    }).toThrow()
  })

  test('handles short private key', () => {
    expect(() => {
      X25519.getPublicKey({ privateKey: '0x1234' })
    }).toThrow()
  })

  test('handles short public key in getSharedSecret', () => {
    const privateKey = X25519.randomPrivateKey()
    expect(() => {
      X25519.getSharedSecret({
        privateKey,
        publicKey: '0x1234',
      })
    }).toThrow()
  })
})

describe('format conversion consistency', () => {
  test('Hex and Bytes formats represent same values', () => {
    const privateKeyHex =
      '0x7777777777777777777777777777777777777777777777777777777777777777'
    const privateKeyBytes = Bytes.from(privateKeyHex)

    const publicKeyHex = X25519.getPublicKey({
      privateKey: privateKeyHex,
      as: 'Hex',
    })
    const publicKeyBytes = X25519.getPublicKey({
      privateKey: privateKeyBytes,
      as: 'Bytes',
    })

    expect(Hex.fromBytes(publicKeyBytes)).toBe(publicKeyHex)
  })

  test('shared secret format conversion consistency', () => {
    const keyPairA = X25519.createKeyPair()
    const keyPairB = X25519.createKeyPair()

    const sharedSecretHex = X25519.getSharedSecret({
      privateKey: keyPairA.privateKey,
      publicKey: keyPairB.publicKey,
      as: 'Hex',
    })
    const sharedSecretBytes = X25519.getSharedSecret({
      privateKey: keyPairA.privateKey,
      publicKey: keyPairB.publicKey,
      as: 'Bytes',
    })

    expect(Hex.fromBytes(sharedSecretBytes)).toBe(sharedSecretHex)
  })
})
