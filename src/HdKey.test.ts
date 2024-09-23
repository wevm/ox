import { expect, test } from 'vitest'
import * as exports from './HdKey.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "fromExtendedKey",
      "fromJson",
      "fromSeed",
      "path",
    ]
  `)
})
