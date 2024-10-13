import { TransactionEnvelope } from 'ox'
import { expect, test } from 'vitest'

test('legacy', () => {
  const envelope = TransactionEnvelope.from({
    chainId: 1,
    gas: 21000n,
    gasPrice: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'legacy',
    r: BigInt(
      '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
    ),
    s: BigInt(
      '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
    ),
    v: 27,
  })

  const hash = TransactionEnvelope.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0x5e427e088ae00b084b41e198c52440aa43b2d6f8f1f01246fd25d4e9b6ebfdab"`,
  )
})

test('eip1559', () => {
  const envelope = TransactionEnvelope.from({
    chainId: 1,
    gas: 21000n,
    maxFeePerGas: 13000000000n,
    maxPriorityFeePerGas: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'eip1559',
    r: BigInt(
      '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
    ),
    s: BigInt(
      '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
    ),
    yParity: 0,
  })

  const hash = TransactionEnvelope.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0x57e6a86fac2dc4b827f6d77d869d625aebf88a71790a740bc859badf556d43c4"`,
  )
})

test('eip2930', () => {
  const envelope = TransactionEnvelope.from({
    accessList: [
      {
        address: '0x0000000000000000000000000000000000000000',
        storageKeys: [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        ],
      },
    ],
    chainId: 1,
    gas: 21000n,
    gasPrice: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'eip2930',
    r: BigInt(
      '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
    ),
    s: BigInt(
      '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
    ),
    v: 27,
  })

  const hash = TransactionEnvelope.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0xfcf39cca082499fb8b96317cc525a6697d65cf7bc8d7fc30d9e8d9b4c45d9a51"`,
  )
})

test('eip4844', () => {
  const envelope = TransactionEnvelope.from({
    blobVersionedHashes: [
      '0x0100000000000000000000000000000000000000000000000000000000000000',
    ],
    chainId: 1,
    gas: 21000n,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'eip4844',
    r: BigInt(
      '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
    ),
    s: BigInt(
      '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
    ),
    yParity: 0,
  })

  const hash = TransactionEnvelope.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0xf3920f47c878feb9c81f159612c8a324fbd7dbf82ec937bf348e3d42e712a03d"`,
  )
})

test('eip7702', () => {
  const envelope = TransactionEnvelope.from({
    authorizationList: [
      {
        address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        chainId: 1,
        nonce: 665n,
        r: BigInt(
          '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
        ),
        s: BigInt(
          '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
        ),
        yParity: 0,
      },
    ],
    chainId: 1,
    gas: 21000n,
    maxFeePerGas: 1000000000n,
    maxPriorityFeePerGas: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'eip7702',
    r: BigInt(
      '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
    ),
    s: BigInt(
      '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
    ),
    yParity: 0,
  })

  const hash = TransactionEnvelope.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0x4a9abf64aff5c1d427018902dbf0ba32436cfee5226a97e2618a55e9710d18ae"`,
  )
})

test('error: unknown type', () => {
  expect(() =>
    // @ts-ignore
    TransactionEnvelope.hash({ type: 'wat' }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionEnvelope.TypeNotImplementedError: The provided transaction type `wat` is not implemented.]',
  )
})
