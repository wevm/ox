import { expect, test } from 'vitest'
import * as exports from './Authorization.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "getSignPayload",
      "hash",
      "from",
      "fromTuple",
      "fromTupleList",
      "toTuple",
      "toTupleList",
    ]
  `)
})
