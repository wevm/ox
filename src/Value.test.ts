import { expect, test } from 'vitest'
import * as exports from './Value.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidDecimalNumberError",
      "formatEther",
      "formatGwei",
      "format",
      "fromEther",
      "fromGwei",
      "from",
      "exponents",
    ]
  `)
})
