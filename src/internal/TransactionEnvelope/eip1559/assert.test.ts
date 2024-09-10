import { TransactionEnvelopeEip1559, Value } from 'ox'
import { expect, test } from 'vitest'

test('fee cap too high', () => {
  expect(() =>
    TransactionEnvelopeEip1559.assert({
      maxFeePerGas: 2n ** 256n - 1n + 1n,
      chainId: 1,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionEnvelope.FeeCapTooHighError: The fee cap (`maxFeePerGas`/`maxPriorityFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
  )
})

test('tip higher than fee cap', () => {
  expect(() =>
    TransactionEnvelopeEip1559.assert({
      maxFeePerGas: Value.fromGwei('10'),
      maxPriorityFeePerGas: Value.fromGwei('11'),
      chainId: 1,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionEnvelope.TipAboveFeeCapError: The provided tip (`maxPriorityFeePerGas` = 11 gwei) cannot be higher than the fee cap (`maxFeePerGas` = 10 gwei).]',
  )
})

test('invalid chainId', () => {
  expect(() =>
    TransactionEnvelopeEip1559.assert({ chainId: 0 }),
  ).toThrowErrorMatchingInlineSnapshot(
    `[TransactionEnvelope.InvalidChainIdError: Chain ID "0" is invalid.]`,
  )
})

test('invalid address', () => {
  expect(() =>
    TransactionEnvelopeEip1559.assert({ to: '0x123', chainId: 1 }),
  ).toThrowErrorMatchingInlineSnapshot(`
    [Address.InvalidAddressError: Address "0x123" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `)
})
