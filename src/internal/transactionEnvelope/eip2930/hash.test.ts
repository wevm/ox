import { TransactionEnvelopeEip2930 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const envelope = TransactionEnvelopeEip2930.from({
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

  const hash = TransactionEnvelopeEip2930.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0xfcf39cca082499fb8b96317cc525a6697d65cf7bc8d7fc30d9e8d9b4c45d9a51"`,
  )
})
