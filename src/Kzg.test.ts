import { expect, test } from 'vitest'
import * as exports from './Kzg.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "from",
      "setup",
    ]
  `)
})
