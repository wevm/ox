import { expect, test } from 'vitest'
import * as exports from './Abi.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "encodeAbiParameters",
      "encodeParameters",
      "encodePacked",
      "decodeAbiParameters",
      "decodeParameters",
      "extractAbiItem",
      "extractItem",
      "getSelector",
      "getSignature",
      "getSignatureHash",
    ]
  `)
})
