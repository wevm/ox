import { expect, test } from 'vitest'
import * as exports from './Rlp.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "toBytes",
      "toHex",
      "from",
      "fromBytes",
      "fromHex",
    ]
  `)
})
