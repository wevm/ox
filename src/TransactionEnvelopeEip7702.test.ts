import { expect, test } from 'vitest'
import * as exports from './TransactionEnvelopeEip7702.js'

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
      "validate",
    ]
  `)
})
