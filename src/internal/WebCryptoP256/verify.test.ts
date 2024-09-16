import { WebCryptoP256 } from 'ox'
import { expect, test } from 'vitest'

const keyPair = await WebCryptoP256.createKeyPair()
const { privateKey, publicKey } = keyPair

test('default', async () => {
  const payload = '0xdeadbeef'
  const { r, s } = await WebCryptoP256.sign({ payload, privateKey })
  expect(
    await WebCryptoP256.verify({ publicKey, payload, signature: { r, s } }),
  ).toBe(true)
})
