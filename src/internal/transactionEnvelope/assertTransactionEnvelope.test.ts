import { TransactionEnvelope, Value } from 'ox'
import { describe, expect, test } from 'vitest'

describe('eip7702', () => {
  test('invalid chainId', () => {
    expect(() =>
      TransactionEnvelope.assertEip7702({
        authorizationList: [
          {
            contractAddress: '0x0000000000000000000000000000000000000000',
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
      `[InvalidChainIdError: Chain ID "0" is invalid.]`,
    )
  })

  test('invalid address', () => {
    expect(() =>
      TransactionEnvelope.assertEip7702({
        authorizationList: [
          {
            contractAddress: '0x0000000000000000000000000000000000000000',
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
      `[InvalidChainIdError: Chain ID "0" is invalid.]`,
    )
  })

  test('fee cap too high', () => {
    expect(() =>
      TransactionEnvelope.assertEip7702({
        authorizationList: [
          {
            contractAddress: '0x0000000000000000000000000000000000000000',
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
      '[FeeCapTooHighError: The fee cap (`maxFeePerGas`/`maxPriorityFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
    )
  })
})

describe('eip4844', () => {
  test('empty blobs', () => {
    expect(() =>
      TransactionEnvelope.assertEip4844({
        blobVersionedHashes: [],
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[EmptyBlobVersionedHashesError: Blob versioned hashes must not be empty.]`,
    )
  })

  test('invalid blob length', () => {
    expect(() =>
      TransactionEnvelope.assertEip4844({
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
      TransactionEnvelope.assertEip4844({
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
      TransactionEnvelope.assertEip4844({
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
})

describe('eip1559', () => {
  test('fee cap too high', () => {
    expect(() =>
      TransactionEnvelope.assertEip1559({
        maxFeePerGas: 2n ** 256n - 1n + 1n,
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[FeeCapTooHighError: The fee cap (`maxFeePerGas`/`maxPriorityFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
    )
  })

  test('tip higher than fee cap', () => {
    expect(() =>
      TransactionEnvelope.assertEip1559({
        maxFeePerGas: Value.parseGwei('10'),
        maxPriorityFeePerGas: Value.parseGwei('11'),
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[TipAboveFeeCapError: The provided tip (`maxPriorityFeePerGas` = 11 gwei) cannot be higher than the fee cap (`maxFeePerGas` = 10 gwei).]',
    )
  })

  test('invalid chainId', () => {
    expect(() =>
      TransactionEnvelope.assertEip1559({ chainId: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[InvalidChainIdError: Chain ID "0" is invalid.]`,
    )
  })

  test('invalid address', () => {
    expect(() =>
      TransactionEnvelope.assertEip1559({ to: '0x123', chainId: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [InvalidAddressError: Address "0x123" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.
      See: https://oxlib.sh/errors#invalidaddresserror]
    `)
  })
})

describe('eip2930', () => {
  test('fee cap too high', () => {
    expect(() =>
      TransactionEnvelope.assertEip2930({
        gasPrice: 2n ** 256n - 1n + 1n,
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[GasPriceTooHighError: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
    )
  })

  test('invalid chainId', () => {
    expect(() =>
      TransactionEnvelope.assertEip2930({ chainId: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[InvalidChainIdError: Chain ID "0" is invalid.]`,
    )
  })

  test('invalid address', () => {
    expect(() =>
      TransactionEnvelope.assertEip2930({ to: '0x123', chainId: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [InvalidAddressError: Address "0x123" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.
      See: https://oxlib.sh/errors#invalidaddresserror]
    `)
  })
})

describe('legacy', () => {
  test('fee cap too high', () => {
    expect(() =>
      TransactionEnvelope.assertLegacy({
        gasPrice: 2n ** 256n - 1n + 1n,
        chainId: 1,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[GasPriceTooHighError: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
    )
  })

  test('invalid chainId', () => {
    expect(() =>
      TransactionEnvelope.assertLegacy({ chainId: 0 }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[InvalidChainIdError: Chain ID "0" is invalid.]`,
    )
  })

  test('invalid address', () => {
    expect(() =>
      TransactionEnvelope.assertLegacy({ to: '0x123', chainId: 1 }),
    ).toThrowErrorMatchingInlineSnapshot(`
      [InvalidAddressError: Address "0x123" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.
      See: https://oxlib.sh/errors#invalidaddresserror]
    `)
  })
})

describe('via `.assert`', () => {
  test('legacy', () => {
    expect(() =>
      TransactionEnvelope.assert({
        to: '0xz',
        type: 'legacy',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `
      [InvalidAddressError: Address "0xz" is invalid.

      Details: Address is not a 20 byte (40 hexadecimal character) value.
      See: https://oxlib.sh/errors#invalidaddresserror]
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
      '[GasPriceTooHighError: The gas price (`gasPrice` = 115792089237316195423570985008687907853269984665640564039457584007913.129639936 gwei) cannot be higher than the maximum allowed value (2^256-1).]',
    )
  })

  test('eip1559', () => {
    expect(() =>
      TransactionEnvelope.assert({
        maxFeePerGas: Value.parseGwei('10'),
        maxPriorityFeePerGas: Value.parseGwei('11'),
        chainId: 1,
        type: 'eip1559',
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      '[TipAboveFeeCapError: The provided tip (`maxPriorityFeePerGas` = 11 gwei) cannot be higher than the fee cap (`maxFeePerGas` = 10 gwei).]',
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
      [InvalidVersionedHashVersionError: Versioned hash "0xcafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe" version is invalid.

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
            contractAddress: '0x0000000000000000000000000000000000000000',
            chainId: 0,
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
      `[InvalidChainIdError: Chain ID "0" is invalid.]`,
    )
  })
})

test('error: invalid transaction type', () => {
  expect(() =>
    // @ts-expect-error
    TransactionEnvelope.assert({ type: 'foo' }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionTypeNotImplementedError: The provided transaction type `foo` is not implemented.]',
  )
})
