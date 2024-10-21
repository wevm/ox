import { AesGcm, Bytes, Hex } from 'ox'
import { expect, test } from 'vitest'

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
