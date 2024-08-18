import { expect, test } from 'vitest'
import * as exports from './Rlp.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "decodeRlp",
      "decode",
      "rlpToBytes",
      "toBytes",
      "rlpToHex",
      "toHex",
      "encodeRlp",
      "encode",
      "bytesToRlp",
      "fromBytes",
      "hexToRlp",
      "fromHex",
    ]
  `)
})
