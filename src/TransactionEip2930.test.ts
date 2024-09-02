import { expect, test } from 'vitest'
import * as exports from './TransactionEip2930.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "typeRpc",
      "type",
      "fromRpc",
    ]
  `)
})
