import { expect, test } from 'vitest'
import * as exports from './Base64.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "from",
      "fromBytes",
      "fromHex",
      "fromString",
      "to",
      "toBytes",
      "toHex",
      "toString",
    ]
  `)
})
