import { expect, test } from 'vitest'
import { TransactionEnvelopeEip1559 } from 'ox'

test('default', () => {
  expect(
    TransactionEnvelopeEip1559.validate({
      chainId: 1,
      maxFeePerGas: 69n,
    }),
  ).toBe(true)
  expect(
    TransactionEnvelopeEip1559.validate({
      chainId: 1,
      maxFeePerGas: 2n ** 257n,
    }),
  ).toBe(false)
})
