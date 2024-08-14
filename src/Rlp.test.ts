import { expect, test } from 'vitest'
import * as exports from './Rlp.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "fromRlp",
      "decode",
      "rlpToBytes",
      "toBytes",
      "rlpToHex",
      "toHex",
      "toRlp",
      "encode",
      "bytesToRlp",
      "fromBytes",
      "hexToRlp",
      "fromHex",
    ]
  `)
})
