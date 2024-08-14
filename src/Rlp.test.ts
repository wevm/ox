import { expect, test } from 'vitest'
import * as exports from './Rlp.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "fromRlp",
      "to",
      "rlpToBytes",
      "toBytes",
      "rlpToHex",
      "toHex",
      "toRlp",
      "from",
      "bytesToRlp",
      "fromBytes",
      "hexToRlp",
      "fromHex",
    ]
  `)
})
