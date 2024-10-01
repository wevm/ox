import { expect, test } from 'vitest'
import { TransactionEnvelopeEip2930 } from 'ox'

test('default', () => {
  expect(
    TransactionEnvelopeEip2930.validate({
      chainId: 1,
      gasPrice: 69n,
    }),
  ).toBe(true)
  expect(
    TransactionEnvelopeEip2930.validate({
      chainId: 1,
      gasPrice: 2n ** 257n,
    }),
  ).toBe(false)
})
