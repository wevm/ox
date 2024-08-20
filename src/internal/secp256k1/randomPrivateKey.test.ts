import { expect, test } from 'vitest'
import { Secp256k1 } from 'ox'

test('default', () => {
  const privateKey = Secp256k1.randomPrivateKey()
  expect(privateKey.length).toBe(66)
})

test('options: to', () => {
  const privateKey = Secp256k1.randomPrivateKey({ to: 'bytes' })
  expect(privateKey.length).toBe(32)
})
