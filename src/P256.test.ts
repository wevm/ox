import { expect, test } from 'vitest'
import * as exports from './P256.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "getPublicKey",
      "randomPrivateKey",
      "recoverPublicKey",
      "sign",
      "verify",
    ]
  `)
})
