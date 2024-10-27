import { TransactionEnvelope, Value } from 'ox'
import { expect, test } from 'vitest'

test('legacy', () => {
  expect(() =>
    TransactionEnvelope.assert({
      to: '0xz',
      type: 'legacy',
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [Address.InvalidAddressError: Address "0xz" is invalid.

    Details: Address is not a 20 byte (40 hexadecimal character) value.]
  `,
  )
})

test('eip2930', () => {
  expect(() =>
    TransactionEnvelope.assert({
      gasPrice: 2n ** 256n - 1n + 1n,
      chainId: 1,
      type: 'eip2930',
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionEnvelope.GasPriceTooHighError: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
  )
})

test('eip1559', () => {
  expect(() =>
    TransactionEnvelope.assert({
      maxFeePerGas: Value.fromGwei('10'),
      maxPriorityFeePerGas: Value.fromGwei('11'),
      chainId: 1,
      type: 'eip1559',
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionEnvelope.TipAboveFeeCapError: The provided tip (`maxPriorityFeePerGas` = 11 gwei) cannot be higher than the fee cap (`maxFeePerGas` = 10 gwei).]',
  )
})

test('eip4844', () => {
  expect(() =>
    TransactionEnvelope.assert({
      blobVersionedHashes: [
        '0xcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
      chainId: 1,
      type: 'eip4844',
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `
    [Blobs.InvalidVersionedHashVersionError: Versioned hash "0xcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe" version is invalid.

    Expected: 1
    Received: 202]
  `,
  )
})

test('eip7702', () => {
  expect(() =>
    TransactionEnvelope.assert({
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
      type: 'eip7702',
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    `[TransactionEnvelope.InvalidChainIdError: Chain ID "-1" is invalid.]`,
  )
})

test('error: invalid transaction type', () => {
  expect(() =>
    // @ts-expect-error
    TransactionEnvelope.assert({ type: 'foo' }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionEnvelope.TypeNotImplementedError: The provided transaction type `foo` is not implemented.]',
  )
})
