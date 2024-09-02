import { expect, test } from 'vitest'
import * as exports from './TransactionEip4844.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "typeRpc",
      "type",
      "fromRpc",
    ]
  `)
})
