import { P256 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const privateKey = P256.randomPrivateKey()
  expect(privateKey.length).toBe(66)
})

test('options: as', () => {
  const privateKey = P256.randomPrivateKey({ as: 'Bytes' })
  expect(privateKey.length).toBe(32)
})
