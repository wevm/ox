import { expect, test } from 'vitest'
import * as exports from './Authorization.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "getAuthorizationSignPayload",
      "getSignPayload",
      "hashAuthorization",
      "hash",
      "toAuthorization",
      "from",
      "toAuthorizationTuple",
      "toTuple",
      "toAuthorizationTupleList",
      "toTupleList",
    ]
  `)
})
