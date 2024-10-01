import { expect, test } from 'vitest'
import { TransactionEnvelope } from 'ox'

test('default', () => {
  expect(
    TransactionEnvelope.validate({
      chainId: 1,
      maxFeePerGas: 69n,
      type: 'eip1559',
    }),
  ).toBe(true)
  expect(
    TransactionEnvelope.validate({
      chainId: 1,
      maxFeePerGas: 2n ** 257n,
      type: 'eip1559',
    }),
  ).toBe(false)
})
