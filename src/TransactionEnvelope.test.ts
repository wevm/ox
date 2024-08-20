import { expect, test } from 'vitest'
import * as exports from './TransactionEnvelope.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
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
