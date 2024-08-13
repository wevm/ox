import { expect, test } from 'vitest'
import * as exports from './Data.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "concat",
      "randomBytes",
    ]
  `)
})
