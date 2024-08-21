import { expect, test } from 'vitest'
import * as exports from './TransactionEnvelope.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "assertTransactionEnvelope",
      "assert",
      "assertTransactionEnvelopeEip1559",
      "assertEip1559",
      "assertTransactionEnvelopeEip2930",
      "assertEip2930",
      "assertTransactionEnvelopeEip4844",
      "assertEip4844",
      "assertTransactionEnvelopeEip7702",
      "assertEip7702",
      "assertTransactionEnvelopeLegacy",
      "assertLegacy",
      "deserializeTransactionEnvelope",
      "deserialize",
      "deserializeTransactionEnvelopeLegacy",
      "deserializeLegacy",
      "serializeTransactionEnvelope",
      "serialize",
      "serializeTransactionEnvelopeLegacy",
      "serializeLegacy",
      "serializeTransactionEnvelopeEip1559",
      "serializeEip1559",
      "serializeTransactionEnvelopeEip2930",
      "serializeEip2930",
      "toTransactionEnvelope",
      "from",
      "toTransactionEnvelopeLegacy",
      "fromLegacy",
      "toTransactionEnvelopeEip1559",
      "fromEip1559",
      "toTransactionEnvelopeEip2930",
      "fromEip2930",
      "toTransactionEnvelopeEip4844",
      "fromEip4844",
      "toTransactionEnvelopeEip7702",
      "fromEip7702",
    ]
  `)
})
