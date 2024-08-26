import { expect, test } from 'vitest'
import * as exports from './Abi.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "encodeParameters",
      "encodePacked",
      "decodeParameters",
      "extractItem",
      "getSelector",
      "getSignature",
      "getSignatureHash",
    ]
  `)
})
