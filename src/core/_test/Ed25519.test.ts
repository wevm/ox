import { Bytes, Ed25519, Hex } from 'ox'
import { describe, expect, test } from 'vitest'

describe('createKeyPair', () => {
  test('default', () => {
    const keyPair = Ed25519.createKeyPair()

    expect(keyPair).toHaveProperty('privateKey')
    expect(keyPair).toHaveProperty('publicKey')
    expect(typeof keyPair.privateKey).toBe('string')
    expect(typeof keyPair.publicKey).toBe('string')
    expect(keyPair.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/)
    expect(keyPair.publicKey).toMatch(/^0x[0-9a-fA-F]{64}$/)
  })

  test('with as: Hex', () => {
    const keyPair = Ed25519.createKeyPair({ as: 'Hex' })

    expect(keyPair).toHaveProperty('privateKey')
    expect(keyPair).toHaveProperty('publicKey')
    expect(typeof keyPair.privateKey).toBe('string')
    expect(typeof keyPair.publicKey).toBe('string')
    expect(keyPair.privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/)
    expect(keyPair.publicKey).toMatch(/^0x[0-9a-fA-F]{64}$/)
  })

  test('with as: Bytes', () => {
    const keyPair = Ed25519.createKeyPair({ as: 'Bytes' })

    expect(keyPair).toHaveProperty('privateKey')
    expect(keyPair).toHaveProperty('publicKey')
    expect(keyPair.privateKey).toBeInstanceOf(Uint8Array)
    expect(keyPair.publicKey).toBeInstanceOf(Uint8Array)
    expect(keyPair.privateKey).toHaveLength(32)
    expect(keyPair.publicKey).toHaveLength(32)
  })

  test('unique keys', () => {
    const keyPair1 = Ed25519.createKeyPair()
    const keyPair2 = Ed25519.createKeyPair()

    expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey)
    expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey)
  })
})

describe('getPublicKey', () => {
  const privateKey =
    '0x9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60'
  const expectedPublicKey =
    '0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a'

  test('default (Hex)', () => {
    const publicKey = Ed25519.getPublicKey({ privateKey })
    expect(publicKey).toBe(expectedPublicKey)
  })

  test('with as: Hex', () => {
    const publicKey = Ed25519.getPublicKey({ privateKey, as: 'Hex' })
    expect(publicKey).toBe(expectedPublicKey)
  })

  test('with as: Bytes', () => {
    const publicKey = Ed25519.getPublicKey({ privateKey, as: 'Bytes' })
    expect(publicKey).toBeInstanceOf(Uint8Array)
    expect(publicKey).toHaveLength(32)
    expect(Hex.fromBytes(publicKey)).toBe(expectedPublicKey)
  })

  test('with Bytes private key', () => {
    const privateKeyBytes = Bytes.fromHex(privateKey)
    const publicKey = Ed25519.getPublicKey({ privateKey: privateKeyBytes })
    expect(publicKey).toBe(expectedPublicKey)
  })

  test('with Bytes private key, as: Bytes', () => {
    const privateKeyBytes = Bytes.fromHex(privateKey)
    const publicKey = Ed25519.getPublicKey({
      privateKey: privateKeyBytes,
      as: 'Bytes',
    })
    expect(publicKey).toBeInstanceOf(Uint8Array)
    expect(publicKey).toHaveLength(32)
    expect(Hex.fromBytes(publicKey)).toBe(expectedPublicKey)
  })
})

describe('randomPrivateKey', () => {
  test('default (Hex)', () => {
    const privateKey = Ed25519.randomPrivateKey()
    expect(typeof privateKey).toBe('string')
    expect(privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/)
  })

  test('with as: Hex', () => {
    const privateKey = Ed25519.randomPrivateKey({ as: 'Hex' })
    expect(typeof privateKey).toBe('string')
    expect(privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/)
  })

  test('with as: Bytes', () => {
    const privateKey = Ed25519.randomPrivateKey({ as: 'Bytes' })
    expect(privateKey).toBeInstanceOf(Uint8Array)
    expect(privateKey).toHaveLength(32)
  })

  test('unique keys', () => {
    const privateKey1 = Ed25519.randomPrivateKey()
    const privateKey2 = Ed25519.randomPrivateKey()
    expect(privateKey1).not.toBe(privateKey2)
  })
})

describe('sign', () => {
  const privateKey =
    '0x9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60'
  const payload = '0xdeadbeef'

  test('default (Hex)', () => {
    const signature = Ed25519.sign({ payload, privateKey })
    expect(typeof signature).toBe('string')
    expect(signature).toMatch(/^0x[0-9a-fA-F]{128}$/)
  })

  test('with as: Hex', () => {
    const signature = Ed25519.sign({ payload, privateKey, as: 'Hex' })
    expect(typeof signature).toBe('string')
    expect(signature).toMatch(/^0x[0-9a-fA-F]{128}$/)
  })

  test('with as: Bytes', () => {
    const signature = Ed25519.sign({ payload, privateKey, as: 'Bytes' })
    expect(signature).toBeInstanceOf(Uint8Array)
    expect(signature).toHaveLength(64)
  })

  test('with Bytes payload', () => {
    const payloadBytes = Bytes.fromHex(payload)
    const signature = Ed25519.sign({ payload: payloadBytes, privateKey })
    expect(typeof signature).toBe('string')
    expect(signature).toMatch(/^0x[0-9a-fA-F]{128}$/)
  })

  test('with Bytes private key', () => {
    const privateKeyBytes = Bytes.fromHex(privateKey)
    const signature = Ed25519.sign({ payload, privateKey: privateKeyBytes })
    expect(typeof signature).toBe('string')
    expect(signature).toMatch(/^0x[0-9a-fA-F]{128}$/)
  })

  test('with all Bytes', () => {
    const payloadBytes = Bytes.fromHex(payload)
    const privateKeyBytes = Bytes.fromHex(privateKey)
    const signature = Ed25519.sign({
      payload: payloadBytes,
      privateKey: privateKeyBytes,
      as: 'Bytes',
    })
    expect(signature).toBeInstanceOf(Uint8Array)
    expect(signature).toHaveLength(64)
  })

  test('deterministic', () => {
    const signature1 = Ed25519.sign({ payload, privateKey })
    const signature2 = Ed25519.sign({ payload, privateKey })
    expect(signature1).toBe(signature2)
  })

  test('known test vector', () => {
    // From RFC 8032 test vectors
    const testPrivateKey =
      '0x9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60'
    const testPayload = '0x' // empty message
    const signature = Ed25519.sign({
      payload: testPayload,
      privateKey: testPrivateKey,
    })

    expect(signature).toBe(
      '0xe5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b',
    )
  })

  describe('integration', () => {
    test('sign and verify cycle', () => {
      const { privateKey, publicKey } = Ed25519.createKeyPair()
      const payload = '0x48656c6c6f2c20576f726c6421'

      const signature = Ed25519.sign({ payload, privateKey })
      const isValid = Ed25519.verify({ payload, publicKey, signature })

      expect(isValid).toBe(true)
    })

    test('sign and verify cycle with Bytes', () => {
      const { privateKey, publicKey } = Ed25519.createKeyPair({ as: 'Bytes' })
      const payload = Bytes.fromString('Hello, World!')

      const signature = Ed25519.sign({ payload, privateKey, as: 'Bytes' })
      const isValid = Ed25519.verify({ payload, publicKey, signature })

      expect(isValid).toBe(true)
    })

    test('multiple signatures with same key', () => {
      const { privateKey, publicKey } = Ed25519.createKeyPair()
      const payloads = [
        '0x48656c6c6f',
        '0x576f726c64',
        '0x546573744d657373616765',
      ] as const

      for (const payload of payloads) {
        const signature = Ed25519.sign({ payload, privateKey })
        const isValid = Ed25519.verify({ payload, publicKey, signature })
        expect(isValid).toBe(true)
      }
    })
  })
})

describe('verify', () => {
  const privateKey =
    '0x9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60'
  const publicKey =
    '0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a'
  const payload = '0xdeadbeef'

  test('valid signature', () => {
    const signature = Ed25519.sign({ payload, privateKey })
    const isValid = Ed25519.verify({ payload, publicKey, signature })
    expect(isValid).toBe(true)
  })

  test('invalid signature', () => {
    const signature = ('0x' + '00'.repeat(64)) as Hex.Hex
    const isValid = Ed25519.verify({ payload, publicKey, signature })
    expect(isValid).toBe(false)
  })

  test('wrong payload', () => {
    const signature = Ed25519.sign({ payload, privateKey })
    const isValid = Ed25519.verify({
      payload: '0xcafebabe',
      publicKey,
      signature,
    })
    expect(isValid).toBe(false)
  })

  test('wrong public key', () => {
    const signature = Ed25519.sign({ payload, privateKey })
    const wrongPublicKey = ('0x' + '11'.repeat(32)) as Hex.Hex
    const isValid = Ed25519.verify({
      payload,
      publicKey: wrongPublicKey,
      signature,
    })
    expect(isValid).toBe(false)
  })

  test('with Bytes payload', () => {
    const payloadBytes = Bytes.fromHex(payload)
    const signature = Ed25519.sign({ payload, privateKey })
    const isValid = Ed25519.verify({
      payload: payloadBytes,
      publicKey,
      signature,
    })
    expect(isValid).toBe(true)
  })

  test('with Bytes public key', () => {
    const publicKeyBytes = Bytes.fromHex(publicKey)
    const signature = Ed25519.sign({ payload, privateKey })
    const isValid = Ed25519.verify({
      payload,
      publicKey: publicKeyBytes,
      signature,
    })
    expect(isValid).toBe(true)
  })

  test('with Bytes signature', () => {
    const signatureHex = Ed25519.sign({ payload, privateKey })
    const signatureBytes = Bytes.fromHex(signatureHex)
    const isValid = Ed25519.verify({
      payload,
      publicKey,
      signature: signatureBytes,
    })
    expect(isValid).toBe(true)
  })

  test('with all Bytes', () => {
    const payloadBytes = Bytes.fromHex(payload)
    const publicKeyBytes = Bytes.fromHex(publicKey)
    const signatureBytes = Ed25519.sign({
      payload: payloadBytes,
      privateKey,
      as: 'Bytes',
    })
    const isValid = Ed25519.verify({
      payload: payloadBytes,
      publicKey: publicKeyBytes,
      signature: signatureBytes,
    })
    expect(isValid).toBe(true)
  })

  test('known test vector', () => {
    // From RFC 8032 test vectors
    const testPublicKey =
      '0xd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a'
    const testPayload = '0x' // empty message
    const testSignature =
      '0xe5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b'

    const isValid = Ed25519.verify({
      payload: testPayload,
      publicKey: testPublicKey,
      signature: testSignature,
    })
    expect(isValid).toBe(true)
  })
})

describe('noble export', () => {
  test('exports noble curves ed25519', () => {
    expect(Ed25519.noble).toBeDefined()
    expect(Ed25519.noble.sign).toBeDefined()
    expect(Ed25519.noble.verify).toBeDefined()
    expect(Ed25519.noble.getPublicKey).toBeDefined()
  })
})
