import { expect, test } from 'vitest'
import * as exports from './PublicKey.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "assert",
      "compress",
      "deserialize",
      "from",
      "serialize",
      "validate",
      "InvalidError",
      "InvalidPrefixError",
      "InvalidCompressedPrefixError",
      "InvalidUncompressedPrefixError",
      "InvalidSerializedSizeError",
    ]
  `)
})
