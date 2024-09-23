import { expect, test } from 'vitest'
import * as exports from './Address.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidChecksumError",
      "InvalidAddressError",
      "InvalidInputError",
      "assert",
      "checksum",
      "from",
      "fromPublicKey",
      "isEqual",
      "validate",
    ]
  `)
})
