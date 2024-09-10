import { expect, test } from 'vitest'
import * as exports from './TransactionEnvelope.js'

test('exports', () => {
  expect(Object.keys(exports)).toMatchInlineSnapshot(`
    [
      "CannotInferTypeError",
      "FeeCapTooHighError",
      "GasPriceTooHighError",
      "InvalidChainIdError",
      "InvalidSerializedError",
      "TipAboveFeeCapError",
      "TypeNotImplementedError",
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
