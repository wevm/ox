import { TransactionEnvelopeEip7702 } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const envelope = TransactionEnvelopeEip7702.from({
    authorizationList: [],
    chainId: 1,
    gas: 21000n,
    maxFeePerGas: 13000000000n,
    maxPriorityFeePerGas: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    r: BigInt(
      '0xacf664dcd984d082b68c434feb66ac684711babdeefe6f101bf8df88fc367a37',
    ),
    s: BigInt(
      '0x5e0800058a9b5c2250bed60ee969a45b7445e562a8298c2d222d114e6dfbfcb9',
    ),
    yParity: 0,
  })

  const hash = TransactionEnvelopeEip7702.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0xa5ccd813e459b9154917af19270091cf3312bd759af08e0e18cd2560ef586cf4"`,
  )
})
