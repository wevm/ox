import { Bytes, Hex, WebCryptoP256 } from 'ox'
import { expect, test } from 'vitest'

test('default', async () => {
  const key = await WebCryptoP256.createKeyPair()
  expect(key.privateKey).toBeDefined()
  expect(Hex.isHex(key.publicKey)).toBeTruthy()
  expect(Hex.size(key.publicKey)).toBe(65)
})

test('options: as: bytes', async () => {
  const key = await WebCryptoP256.createKeyPair({ as: 'Bytes' })
  expect(key.privateKey).toBeDefined()
  expect(key.publicKey instanceof Uint8Array).toBeTruthy()
  expect(Bytes.size(key.publicKey)).toBe(65)
})

test('options: compressed: true', async () => {
  const key = await WebCryptoP256.createKeyPair({ compressed: true })
  expect(key.privateKey).toBeDefined()
  expect(Hex.size(key.publicKey)).toBe(64)
})
