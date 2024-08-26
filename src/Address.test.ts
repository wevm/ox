import { expect, test } from 'vitest'
import * as exports from './Address.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidAddressChecksumError",
      "InvalidAddressError",
      "InvalidAddressInputError",
      "assert",
      "checksum",
      "isAddress",
      "from",
      "fromPublicKey",
      "isEqual",
    ]
  `)
})
