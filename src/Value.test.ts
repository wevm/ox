import { expect, test } from 'vitest'
import * as exports from './Value.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "exponents",
      "formatEther",
      "formatGwei",
      "formatValue",
      "format",
      "parseEther",
      "fromEther",
      "parseGwei",
      "fromGwei",
      "parseValue",
      "from",
    ]
  `)
})
