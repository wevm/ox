import { TransactionEnvelopeLegacy } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const envelope = TransactionEnvelopeLegacy.from({
    chainId: 1,
    gas: 21000n,
    gasPrice: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    r: BigInt(
      '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
    ),
    s: BigInt(
      '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
    ),
    v: 27,
  })

  const hash = TransactionEnvelopeLegacy.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0x5e427e088ae00b084b41e198c52440aa43b2d6f8f1f01246fd25d4e9b6ebfdab"`,
  )
})
