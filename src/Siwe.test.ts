import { expect, test } from 'vitest'
import * as exports from './Siwe.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "createMessage",
      "generateNonce",
      "isUri",
      "parseMessage",
      "validateMessage",
    ]
  `)
})
