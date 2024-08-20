import { expect, test } from 'vitest'
import * as exports from './Secp256k1.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "getPublicKey",
      "randomPrivateKey",
      "recoverAddress",
      "recoverPublicKey",
      "sign",
      "verify",
    ]
  `)
})
