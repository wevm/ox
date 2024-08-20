import { expect, test } from 'vitest'
import * as exports from './Siwe.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "createMessage",
      "createSiweMessage",
      "generateNonce",
      "generateSiweNonce",
      "isUri",
      "parseMessage",
      "parseSiweMessage",
      "validateMessage",
      "validateSiweMessage",
    ]
  `)
})
