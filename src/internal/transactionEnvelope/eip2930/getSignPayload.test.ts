import { Secp256k1, TransactionEnvelopeEip2930 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'

test('default', () => {
  const envelope = TransactionEnvelopeEip2930.from({
    chainId: 1,
    gas: 21000n,
    maxFeePerGas: 13000000000n,
    maxPriorityFeePerGas: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'eip2930',
  })

  const hash = TransactionEnvelopeEip2930.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0x0ec6ac926e256ac597c5e6a2e635019ccd07974365f970f479589ace534db44a"`,
  )

  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip2930.getSignPayload(envelope),
    privateKey: accounts[0].privateKey,
  })

  const envelope_signed = TransactionEnvelopeEip2930.from(envelope, {
    signature,
  })

  {
    const hash = TransactionEnvelopeEip2930.hash(envelope_signed)
    expect(hash).toMatchInlineSnapshot(
      `"0x70bbd82fb81c02a945125319cb58a42a69f38426d0870f9be2b196437b3dd177"`,
    )
  }
  {
    const hash_presign =
      TransactionEnvelopeEip2930.getSignPayload(envelope_signed)
    expect(hash_presign).toEqual(hash)
  }
})
