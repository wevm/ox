import { expect, test } from 'vitest'
import * as exports from './Rlp.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "toBytes",
      "toHex",
      "to",
      "decodeRlpCursor",
      "readLength",
      "readList",
      "from",
      "fromBytes",
      "fromHex",
    ]
  `)
})
