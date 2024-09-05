import { expect, test } from 'vitest'
import * as exports from './AbiError.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "format",
      "from",
      "fromAbi",
      "getSelector",
    ]
  `)
})
