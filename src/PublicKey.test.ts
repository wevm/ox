import { expect, test } from 'vitest'
import * as exports from './PublicKey.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "InvalidCompressedPrefixError",
      "InvalidError",
      "InvalidPrefixError",
      "InvalidSerializedSizeError",
      "InvalidUncompressedPrefixError",
      "assert",
      "compress",
      "deserialize",
      "from",
      "serialize",
    ]
  `)
})
