import { expect, test } from 'vitest'
import * as exports from './Address.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "assertAddress",
      "assert",
      "checksumAddress",
      "checksum",
      "isAddress",
      "toAddress",
      "from",
      "isAddressEqual",
      "isEqual",
    ]
  `)
})
