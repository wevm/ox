import { expect, test } from 'vitest'
import * as exports from './TransactionEnvelopeEip2930.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "serializedType",
      "type",
      "assert",
      "deserialize",
      "from",
      "getSignPayload",
      "hash",
      "serialize",
    ]
  `)
})
