import { expect, test } from 'vitest'
import * as exports from './Value.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "exponents",
      "formatEther",
      "formatGwei",
      "format",
      "fromEther",
      "fromGwei",
      "from",
    ]
  `)
})
