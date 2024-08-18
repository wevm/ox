import { expect, test } from 'vitest'
import * as exports from './Abi.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "encodeAbi",
      "encode",
      "getAbiItem",
      "getItem",
      "getSelector",
      "getSignature",
      "getSignatureHash",
    ]
  `)
})
