import { expect, test } from 'vitest'
import * as exports from './TransactionEip1559.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "fromRpc",
    ]
  `)
})
