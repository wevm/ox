import { AesGcm, Bytes } from 'ox'
import { expect, test } from 'vitest'

test('default', async () => {
  const key = await AesGcm.getKey({ password: 'qwerty' })
  const encrypted = await AesGcm.encrypt(
    Bytes.fromString('i am a secret message'),
    key,
  )
  expect(encrypted).toHaveLength(53)
})
