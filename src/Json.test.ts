import { expect, test } from 'vitest'
import * as exports from './Json.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "parse",
      "stringify",
    ]
  `)
})
