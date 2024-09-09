import { expect, test } from 'vitest'
import * as exports from './Log.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "fromRpc",
    ]
  `)
})
