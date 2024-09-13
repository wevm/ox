import { WebCryptoP256 } from 'ox'
import { expect, test } from 'vitest'

const { privateKey } = await WebCryptoP256.createKeyPair()

test('default', async () => {
  const signature = await WebCryptoP256.sign({
    payload:
      '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
    privateKey,
  })
  expect(signature.r).toBeDefined()
  expect(signature.s).toBeDefined()
})
