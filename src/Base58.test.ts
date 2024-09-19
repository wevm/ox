import { expect, test } from 'vitest'
import * as exports from './Base58.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "fromBytes",
      "fromHex",
      "fromString",
      "toBytes",
      "toHex",
      "toString",
    ]
  `)
})
