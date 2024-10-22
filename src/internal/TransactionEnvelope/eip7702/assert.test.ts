import { TransactionEnvelopeEip7702 } from 'ox'
import { expect, test } from 'vitest'

test('invalid chainId', () => {
  expect(() =>
    TransactionEnvelopeEip7702.assert({
      authorizationList: [
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: -1,
          nonce: 0n,
          r: 0n,
          s: 0n,
          yParity: 0,
        },
      ],
      chainId: 1,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `[TransactionEnvelope.InvalidChainIdError: Chain ID "-1" is invalid.]`,
  )
})

test('invalid address', () => {
  expect(() =>
    TransactionEnvelopeEip7702.assert({
      authorizationList: [
        {
          address: '0x000000000000000000000000000000000000000z',
          chainId: 0,
          nonce: 0n,
          r: 0n,
          s: 0n,
          yParity: 0,
        },
      ],
      chainId: 1,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [Address.InvalidAddressError: Address "0x000000000000000000000000000000000000000z" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.
    See: https://oxlib.sh/errors#invalidaddresserror]
  `,
  )
})

test('fee cap too high', () => {
  expect(() =>
    TransactionEnvelopeEip7702.assert({
      authorizationList: [
        {
          address: '0x0000000000000000000000000000000000000000',
          chainId: 1,
          nonce: 0n,
          r: 0n,
          s: 0n,
          yParity: 0,
        },
      ],
      maxFeePerGas: 2n ** 256n - 1n + 1n,
      chainId: 1,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionEnvelope.FeeCapTooHighError: The fee cap (`maxFeePerGas`/`maxPriorityFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
  )
})
