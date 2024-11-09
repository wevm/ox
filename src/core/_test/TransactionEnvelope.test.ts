import { TransactionEnvelope } from 'ox'
import { expect, test } from 'vitest'

test('exports', () => {
  expect(Object.keys(TransactionEnvelope)).toMatchInlineSnapshot(`
    [
      "FeeCapTooHighError",
      "GasPriceTooHighError",
      "InvalidChainIdError",
      "InvalidSerializedError",
      "TipAboveFeeCapError",
    ]
  `)
})
