import { expect, test } from 'vitest'
import * as exports from './Data.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "concat",
      "isBytes",
      "isHex",
      "padLeft",
      "padRight",
      "isBytesEqual",
      "randomBytes",
      "size",
      "slice",
      "trimLeft",
      "trimRight",
    ]
  `)
})
