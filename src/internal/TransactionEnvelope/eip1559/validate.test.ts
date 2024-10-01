import { TransactionEnvelopeEip1559 } from 'ox'
import { expect, test } from 'vitest'

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
