import { expect, test } from 'vitest'
import * as exports from './AbiFunction.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "decodeInput",
      "decodeOutput",
      "encodeInput",
      "encodeOutput",
      "format",
      "from",
      "fromAbi",
      "getSelector",
    ]
  `)
})
