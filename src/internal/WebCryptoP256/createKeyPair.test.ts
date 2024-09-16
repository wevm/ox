import { WebCryptoP256 } from 'ox'
import { expect, test } from 'vitest'

test('default', async () => {
  const key = await WebCryptoP256.createKeyPair()
  expect(key.privateKey).toBeDefined()
  expect(key.publicKey.prefix).toBeDefined()
  expect(key.publicKey.x).toBeDefined()
  expect(key.publicKey.y).toBeDefined()
})
