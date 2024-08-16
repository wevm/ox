import { expect, test } from 'vitest'
import * as exports from './index.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "Abi",
      "Bytes",
      "Data",
      "Errors",
      "Hash",
      "Hex",
      "Rlp",
      "Types",
      "Value",
    ]
  `)
})
