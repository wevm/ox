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

test('exports', () => {
  expect(Object.keys(AesGcm)).toMatchInlineSnapshot(`
    [
      "ivLength",
      "decrypt",
      "encrypt",
      "getKey",
      "randomSalt",
    ]
  `)
})
