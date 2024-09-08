import { expect, test } from 'vitest'
import * as exports from './AbiConstructor.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "encode",
      "decode",
      "format",
      "from",
      "fromAbi",
    ]
  `)
})
