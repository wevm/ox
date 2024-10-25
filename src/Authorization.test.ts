import { expect, test } from 'vitest'
import * as exports from './Authorization.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "from",
      "fromRpc",
      "fromRpcList",
      "fromTuple",
      "fromTupleList",
      "getSignPayload",
      "hash",
      "toRpc",
      "toRpcList",
      "toTuple",
      "toTupleList",
    ]
  `)
})
