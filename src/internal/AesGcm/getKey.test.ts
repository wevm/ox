import { AesGcm } from 'ox'
import { expect, test } from 'vitest'

test('default', async () => {
  const key = await AesGcm.getKey({ password: 'qwerty' })
  expect(key).toMatchInlineSnapshot('CryptoKey {}')
})
