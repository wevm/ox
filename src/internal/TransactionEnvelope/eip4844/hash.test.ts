import { TransactionEnvelopeEip4844 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const envelope = TransactionEnvelopeEip4844.from({
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

  const hash = TransactionEnvelopeEip4844.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0xf3920f47c878feb9c81f159612c8a324fbd7dbf82ec937bf348e3d42e712a03d"`,
  )
})
