import { expect, test } from 'vitest'
import * as exports from './Caches.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "checksum",
      "clear",
    ]
  `)
})
