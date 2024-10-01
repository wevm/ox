import { expect, test } from 'vitest'
import { TransactionEnvelopeLegacy } from 'ox'

test('default', () => {
  expect(
    TransactionEnvelopeLegacy.validate({
      chainId: 1,
      gasPrice: 69n,
    }),
  ).toBe(true)
  expect(
    TransactionEnvelopeLegacy.validate({
      chainId: 1,
      gasPrice: 2n ** 257n,
    }),
  ).toBe(false)
})
