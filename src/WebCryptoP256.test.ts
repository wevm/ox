import { expect, test } from 'vitest'
import * as exports from './WebCryptoP256.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidDecimalNumberError",
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
