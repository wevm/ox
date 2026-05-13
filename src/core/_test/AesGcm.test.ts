import { AesGcm, Bytes, Hex } from 'ox'
import { describe, expect, test } from 'vitest'

describe('decrypt', () => {
  test('default', async () => {
    const key = await AesGcm.getKey({ password: 'qwerty' })
    const encrypted = await AesGcm.encrypt(
      Hex.fromString('i am a secret message'),
      key,
    )

    const decrypted = await AesGcm.decrypt(encrypted, key)
    expect(decrypted).toEqual(Hex.fromString('i am a secret message'))

    const key_invalid = await AesGcm.getKey({ password: 'qwerty1' })
    expect(() =>
      AesGcm.decrypt(encrypted, key_invalid),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[OperationError: The operation failed for an operation-specific reason]',
    )
  })

  test('args: as: Hex', async () => {
    const key = await AesGcm.getKey({ password: 'qwerty' })
    const encrypted = await AesGcm.encrypt(
      Bytes.fromString('i am a secret message'),
      key,
    )

    const decrypted = await AesGcm.decrypt(encrypted, key, { as: 'Hex' })
    expect(decrypted).toEqual(Hex.fromString('i am a secret message'))

    const key_invalid = await AesGcm.getKey({ password: 'qwerty1' })
    expect(() =>
      AesGcm.decrypt(encrypted, key_invalid),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[OperationError: The operation failed for an operation-specific reason]',
    )
  })

  test('behavior: inferred return type (value as Bytes)', async () => {
    const key = await AesGcm.getKey({ password: 'qwerty' })
    const encrypted = await AesGcm.encrypt(
      Bytes.fromString('i am a secret message'),
      key,
    )
    expect(encrypted).toHaveLength(53)
    expect(Bytes.validate(encrypted)).toBe(true)

    const decrypted = await AesGcm.decrypt(encrypted, key)
    expect(decrypted).toEqual(Bytes.fromString('i am a secret message'))
  })
})

describe('encrypt', () => {
  test('default', async () => {
    const key = await AesGcm.getKey({ password: 'qwerty' })
    const encrypted = await AesGcm.encrypt(
      Bytes.fromString('i am a secret message'),
      key,
    )
    expect(encrypted).toHaveLength(53)
    expect(Bytes.validate(encrypted)).toBe(true)
  })

  test('args: as: Bytes', async () => {
    const key = await AesGcm.getKey({ password: 'qwerty' })
    const encrypted = await AesGcm.encrypt(
      Bytes.fromString('i am a secret message'),
      key,
      { as: 'Hex' },
    )
    expect(encrypted).toHaveLength(108)
    expect(Hex.validate(encrypted)).toBe(true)
  })

  test('behavior: inferred return type (value as Hex)', async () => {
    const key = await AesGcm.getKey({ password: 'qwerty' })
    const encrypted = await AesGcm.encrypt(
      Hex.fromString('i am a secret message'),
      key,
    )
    expect(encrypted).toHaveLength(108)
    expect(Hex.validate(encrypted)).toBe(true)
  })
})

describe('getKey', () => {
  test('default', async () => {
    const key = await AesGcm.getKey({ password: 'qwerty' })
    expect(key).toMatchInlineSnapshot('CryptoKey {}')
  })
})

describe('randomSalt', () => {
  test('default', () => {
    const salt = AesGcm.randomSalt()
    expect(salt).toHaveLength(32)
  })
})

describe('deriveKey', () => {
  test('returns key + salt + iterations', async () => {
    const result = await AesGcm.deriveKey({
      password: 'test-password',
      iterations: 1,
    })
    expect(result.iterations).toBe(1)
    expect(result.salt).toHaveLength(32)
    expect(result.key).toBeInstanceOf(CryptoKey)
  })

  test('round-trip: same salt + iterations -> identical encrypt/decrypt', async () => {
    const { key: k1, salt } = await AesGcm.deriveKey({
      password: 'test-password',
      iterations: 1,
    })
    const { key: k2 } = await AesGcm.deriveKey({
      password: 'test-password',
      salt,
      iterations: 1,
    })
    const encrypted = await AesGcm.encrypt(Hex.fromString('hi'), k1)
    const decrypted = await AesGcm.decrypt(encrypted, k2)
    expect(decrypted).toEqual(Hex.fromString('hi'))
  })
})

describe('encryptEnvelope / decryptEnvelope', () => {
  test('round-trip default (Hex)', async () => {
    const key = await AesGcm.getKey({ password: 'test-password' })
    const envelope = await AesGcm.encryptEnvelope(
      Hex.fromString('hello envelope'),
      key,
    )
    expect(typeof envelope).toBe('string')
    const decoded = await AesGcm.decryptEnvelope(envelope, key)
    expect(decoded).toEqual(Hex.fromString('hello envelope'))
  })

  test('round-trip Bytes input', async () => {
    const key = await AesGcm.getKey({ password: 'test-password' })
    const envelope = await AesGcm.encryptEnvelope(
      Bytes.fromString('hello envelope'),
      key,
      { as: 'Bytes' },
    )
    expect(envelope).toBeInstanceOf(Uint8Array)
    expect(envelope[0]).toBe(AesGcm.envelopeVersion)
    const decoded = await AesGcm.decryptEnvelope(envelope, key)
    expect(decoded).toEqual(Bytes.fromString('hello envelope'))
  })

  test('uses 12-byte IV', async () => {
    const key = await AesGcm.getKey({ password: 'test-password' })
    const envelope = await AesGcm.encryptEnvelope(
      Bytes.fromString('x'),
      key,
      { as: 'Bytes' },
    )
    // 1 (version) + 12 (iv) + 1 (plaintext) + 16 (tag) = 30
    expect(envelope.length).toBe(1 + AesGcm.ivLengthV1 + 1 + 16)
  })

  test('rejects unsupported version byte', async () => {
    const key = await AesGcm.getKey({ password: 'test-password' })
    const garbage = new Uint8Array(20).fill(0xff)
    await expect(
      AesGcm.decryptEnvelope(garbage, key),
    ).rejects.toThrowError(AesGcm.InvalidEnvelopeError)
  })

  test('rejects too-short envelope', async () => {
    const key = await AesGcm.getKey({ password: 'test-password' })
    await expect(
      AesGcm.decryptEnvelope(new Uint8Array([0x01]), key),
    ).rejects.toThrowError(AesGcm.InvalidEnvelopeError)
  })

  test('legacy 16-byte-prefix decrypt still works', async () => {
    const key = await AesGcm.getKey({ password: 'test-password' })
    const legacy = await AesGcm.encrypt(Hex.fromString('legacy'), key)
    const decoded = await AesGcm.decrypt(legacy, key)
    expect(decoded).toEqual(Hex.fromString('legacy'))
  })
})

test('exports', () => {
  expect(Object.keys(AesGcm)).toMatchInlineSnapshot(`
    [
      "ivLength",
      "ivLengthV1",
      "envelopeVersion",
      "decrypt",
      "encrypt",
      "getKey",
      "randomSalt",
      "deriveKey",
      "encryptEnvelope",
      "decryptEnvelope",
      "InvalidEnvelopeError",
    ]
  `)
})
