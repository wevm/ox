import { WebCryptoP256 } from 'ox'
import { describe, expect, test } from 'vitest'

const { privateKey, publicKey } = await WebCryptoP256.createKeyPair()

describe('createKeyPair', () => {
  test('default', async () => {
    const key = await WebCryptoP256.createKeyPair()
    expect(key.privateKey).toBeDefined()
    expect(key.publicKey.prefix).toBeDefined()
    expect(key.publicKey.x).toBeDefined()
    expect(key.publicKey.y).toBeDefined()
  })
})

describe('sign', () => {
  test('default', async () => {
    const signature = await WebCryptoP256.sign({
      payload:
        '0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68',
      privateKey,
    })
    expect(signature.r).toBeDefined()
    expect(signature.s).toBeDefined()
  })
})

describe('verify', () => {
  test('default', async () => {
    const payload = '0xdeadbeef'
    const { r, s } = await WebCryptoP256.sign({ payload, privateKey })
    expect(
      await WebCryptoP256.verify({ publicKey, payload, signature: { r, s } }),
    ).toBe(true)
  })
})

test('exports', () => {
  expect(Object.keys(WebCryptoP256)).toMatchInlineSnapshot(`
    [
      "createKeyPair",
      "sign",
      "verify",
    ]
  `)
})
