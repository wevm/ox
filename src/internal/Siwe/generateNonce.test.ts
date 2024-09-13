import { Siwe } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const nonce = Siwe.generateNonce()
  expect(nonce.length).toMatchInlineSnapshot('96')
})
