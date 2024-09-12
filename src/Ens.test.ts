import { expect, test } from 'vitest'
import * as exports from './Ens.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "labelhash",
      "namehash",
      "normalize",
    ]
  `)
})
