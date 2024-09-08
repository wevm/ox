import { expect, test } from 'vitest'
import * as exports from './AbiEvent.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "decode",
      "encode",
      "format",
      "from",
      "getSelector",
    ]
  `)
})
