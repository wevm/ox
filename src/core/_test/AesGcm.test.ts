import { AesGcm, Bytes, Hex, Mnemonic } from 'ox'
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

describe('fromMnemonic', () => {
  const mnemonic = 'test test test test test test test test test test test junk'

  test('default', async () => {
    const key = await AesGcm.fromMnemonic(mnemonic)
    const expectedKey = await AesGcm.fromSeed(Mnemonic.toSeed(mnemonic))
    const value = Bytes.fromString('i am a secret message')
    const encrypted = await AesGcm.encrypt(value, key)

    await expect(AesGcm.decrypt(encrypted, expectedKey)).resolves.toEqual(value)
  })

  test('options: passphrase', async () => {
    const key = await AesGcm.fromMnemonic(mnemonic, {
      passphrase: 'qwerty',
    })
    const defaultKey = await AesGcm.fromMnemonic(mnemonic)
    const encrypted = await AesGcm.encrypt('0xdeadbeef', key)

    await expect(AesGcm.decrypt(encrypted, defaultKey)).rejects.toThrowError()
  })
})

describe('fromSeed', () => {
  const seed =
    '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'

  test('vector', async () => {
    const key = await AesGcm.fromSeed(seed)
    const expectedKey = await globalThis.crypto.subtle.importKey(
      'raw',
      Bytes.fromHex(
        '0xd42ffe5cb894ce61e9f448e8083f53b2ab90d2acad0929e80b0abb85e915cb3a',
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
    const key = await AesGcm.fromSeed(Bytes.fromHex(seed))
    const value = Bytes.fromString('i am a secret message')

    await expect(
      AesGcm.decrypt(await AesGcm.encrypt(value, key), key),
    ).resolves.toEqual(value)
  })

  test('behavior: accepts seeds longer than 32 bytes', async () => {
    const key = await AesGcm.fromSeed(new Uint8Array(64))

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

  test('error: seed is too short', async () => {
    await expect(
      AesGcm.fromSeed(new Uint8Array(31)),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[AesGcm.InvalidSeedSizeError: Seed must contain at least 32 bytes. Received 31 bytes.]`,
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
      "InvalidSeedSizeError",
      "decrypt",
      "encrypt",
      "fromMnemonic",
      "fromSeed",
      "getKey",
      "randomSalt",
    ]
  `)
})
