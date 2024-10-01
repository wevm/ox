import { TransactionEnvelopeEip7702 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  expect(
    TransactionEnvelopeEip7702.validate({
      authorizationList: [],
      chainId: 1,
    }),
  ).toBe(true)
  expect(
    TransactionEnvelopeEip7702.validate({
      authorizationList: [],
      maxFeePerGas: 2n ** 257n,
      chainId: 1,
    }),
  ).toBe(false)
})
