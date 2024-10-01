import { expect, test } from 'vitest'
import { TransactionEnvelopeEip4844 } from 'ox'

test('default', () => {
  expect(
    TransactionEnvelopeEip4844.validate({
      blobVersionedHashes: [
        '0x0100000000000000000000000000000000000000000000000000000000000000',
      ],
      chainId: 1,
    }),
  ).toBe(true)
  expect(
    TransactionEnvelopeEip4844.validate({
      blobVersionedHashes: [],
      chainId: 1,
    }),
  ).toBe(false)
})
