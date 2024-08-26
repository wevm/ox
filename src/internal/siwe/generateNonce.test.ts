import { expect, test } from 'vitest'

import { Siwe } from 'ox'

test('default', () => {
  const nonce = Siwe.generateNonce()
  expect(nonce.length).toMatchInlineSnapshot('96')
})
