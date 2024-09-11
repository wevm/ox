import { expect, test } from 'vitest'
import * as exports from './Provider.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "IsUndefinedError",
      "createEmitter",
      "from",
    ]
  `)
})
