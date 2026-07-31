import { AesGcm, Bytes, Hex } from 'ox'
import { describe, expect, test } from 'vp/test'

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
    await expect(() =>
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
    await expect(() =>
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

describe('fromPrf', () => {
  test('vector', async () => {
    const key = await AesGcm.fromPrf(
      '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    )
    const expectedKey = await globalThis.crypto.subtle.importKey(
      'raw',
      Bytes.fromHex(
        '0x95c3c66b64baf063678e43d8aa98e1a4b4447c431fa9434b79e4a8c01ee85e07',
      ),
      { name: 'AES-GCM' },
      false,
      ['decrypt'],
    )
    const value = Bytes.fromString('i am a secret message')
    const encrypted = await AesGcm.encrypt(value, key)

    await expect(AesGcm.decrypt(encrypted, expectedKey)).resolves.toEqual(value)
  })

  test('value: Bytes', async () => {
    const key = await AesGcm.fromPrf(
      Bytes.fromHex(
        '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      ),
    )
    const value = Bytes.fromString('i am a secret message')

    await expect(
      AesGcm.decrypt(await AesGcm.encrypt(value, key), key),
    ).resolves.toEqual(value)
  })

  test('behavior: CryptoKey properties', async () => {
    const key = await AesGcm.fromPrf(new Uint8Array(32))

    expect({
      algorithm: key.algorithm,
      extractable: key.extractable,
      type: key.type,
      usages: key.usages,
    }).toMatchInlineSnapshot(`
      {
        "algorithm": {
          "length": 256,
          "name": "AES-GCM",
        },
        "extractable": false,
        "type": "secret",
        "usages": [
          "encrypt",
          "decrypt",
        ],
      }
    `)
  })

  test('error: PRF output is too short', async () => {
    await expect(
      AesGcm.fromPrf(new Uint8Array(31)),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[AesGcm.InvalidPrfSizeError: PRF output must be exactly 32 bytes. Received 31 bytes.]`,
    )
  })

  test('error: PRF output is too long', async () => {
    await expect(
      AesGcm.fromPrf(new Uint8Array(33)),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[AesGcm.InvalidPrfSizeError: PRF output must be exactly 32 bytes. Received 33 bytes.]`,
    )
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

test('exports', () => {
  expect(Object.keys(AesGcm)).toMatchInlineSnapshot(`
    [
      "ivLength",
      "decrypt",
      "encrypt",
      "fromPrf",
      "getKey",
      "randomSalt",
      "InvalidPrfSizeError",
    ]
  `)
})
