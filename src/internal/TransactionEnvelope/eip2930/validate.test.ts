import { TransactionEnvelopeEip2930 } from 'ox'
import { expect, test } from 'vitest'

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
