import { expect, test } from 'vitest'
import * as exports from './TransactionEnvelope.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "assert",
      "assertEip1559",
      "assertEip2930",
      "assertEip4844",
      "assertEip7702",
      "assertLegacy",
      "deserialize",
      "deserializeLegacy",
      "deserializeEip1559",
      "deserializeEip2930",
      "deserializeEip4844",
      "getSignPayload",
      "hash",
      "serialize",
      "serializeLegacy",
      "serializeEip1559",
      "serializeEip2930",
      "serializeEip4844",
      "from",
      "fromLegacy",
      "fromEip1559",
      "fromEip2930",
      "fromEip4844",
      "fromEip7702",
    ]
  `)
})
