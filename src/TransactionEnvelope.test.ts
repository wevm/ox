import { expect, test } from 'vitest'
import * as exports from './TransactionEnvelope.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "CannotInferTransactionTypeError",
      "FeeCapTooHighError",
      "GasPriceTooHighError",
      "InvalidChainIdError",
      "InvalidSerializedTransactionError",
      "TipAboveFeeCapError",
      "TransactionTypeNotImplementedError",
      "assert",
      "deserialize",
      "getSignPayload",
      "hash",
      "serialize",
      "from",
      "toRpc",
    ]
  `)
})
