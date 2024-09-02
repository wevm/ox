import { TransactionEnvelopeEip4844 } from 'ox'
import { expect, test } from 'vitest'

test('empty blobs', () => {
  expect(() =>
    TransactionEnvelopeEip4844.assert({
      blobVersionedHashes: [],
      chainId: 1,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[EmptyBlobVersionedHashesError: Blob versioned hashes must not be empty.]',
  )
})

test('invalid blob length', () => {
  expect(() =>
    TransactionEnvelopeEip4844.assert({
      blobVersionedHashes: ['0xcafebabe'],
      chainId: 1,
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
      [InvalidVersionedHashSizeError: Versioned hash "0xcafebabe" size is invalid.

      Expected: 32
      Received: 4]
    `)
})

test('invalid blob version', () => {
  expect(() =>
    TransactionEnvelopeEip4844.assert({
      blobVersionedHashes: [
        '0xcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
      chainId: 1,
    }),
  ).toThrowErrorMatchingInlineSnapshot(`
      [InvalidVersionedHashVersionError: Versioned hash "0xcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe" version is invalid.

      Expected: 1
      Received: 202]
    `)
})

test('fee cap too high', () => {
  expect(() =>
    TransactionEnvelopeEip4844.assert({
      blobVersionedHashes: [
        '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
      ],
      maxFeePerGas: 2n ** 256n - 1n + 1n,
      chainId: 1,
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[FeeCapTooHighError: The fee cap (`maxFeePerGas`/`maxPriorityFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
  )
})
