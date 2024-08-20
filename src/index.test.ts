import { expect, test } from 'vitest'
import * as exports from './index.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "Abi",
      "Address",
      "Caches",
      "Constants",
      "Bytes",
      "Data",
      "Errors",
      "Hash",
      "Hex",
      "Signature",
      "Rlp",
      "TypedData",
      "Types",
      "Value",
    ]
  `)
})
