import { expect, test } from 'vitest'
import * as exports from './AbiFunction.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "decodeData",
      "decodeResult",
      "encodeData",
      "encodeResult",
      "format",
      "from",
      "fromAbi",
      "getSelector",
    ]
  `)
})
