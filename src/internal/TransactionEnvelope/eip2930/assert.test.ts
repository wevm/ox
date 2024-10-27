import { TransactionEnvelopeEip2930 } from 'ox'
import { expect, test } from 'vitest'

test('fee cap too high', () => {
  expect(() =>
    TransactionEnvelopeEip2930.assert({
      gasPrice: 2n ** 256n - 1n + 1n,
      chainId: 1,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionEnvelope.GasPriceTooHighError: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
  )
})

test('invalid chainId', () => {
  expect(() =>
    TransactionEnvelopeEip2930.assert({ chainId: 0 }),
  ).toThrowErrorMatchingInlineSnapshot(
    `[TransactionEnvelope.InvalidChainIdError: Chain ID "0" is invalid.]`,
  )
})

test('invalid address', () => {
  expect(() =>
    TransactionEnvelopeEip2930.assert({ to: '0x123', chainId: 1 }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0x123" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `)
})
