import { expect, test } from 'vitest'
import * as exports from './TransactionReceipt.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "status",
      "statusRpc",
      "type",
      "typeRpc",
      "fromRpc",
    ]
  `)
})
