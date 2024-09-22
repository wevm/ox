import { Secp256k1, TransactionEnvelopeEip1559 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'

test('default', () => {
  const envelope = TransactionEnvelopeEip1559.from({
    chainId: 1,
    gas: 21000n,
    maxFeePerGas: 13000000000n,
    maxPriorityFeePerGas: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'eip1559',
  })

  const hash = TransactionEnvelopeEip1559.hash(envelope, { presign: true })
  expect(hash).toMatchInlineSnapshot(
    `"0x1d099d1f25465b53e1e56e715e35d5daaaef6a9e9883ba21652eea7f411fffc7"`,
  )

  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip1559.getSignPayload(envelope),
    privateKey: accounts[0].privateKey,
  })

  const envelope_signed = TransactionEnvelopeEip1559.from(envelope, {
    signature,
  })

  {
    const hash = TransactionEnvelopeEip1559.hash(envelope_signed)
    expect(hash).toMatchInlineSnapshot(
      `"0x57e6a86fac2dc4b827f6d77d869d625aebf88a71790a740bc859badf556d43c4"`,
    )
  }
  {
    const hash_presign =
      TransactionEnvelopeEip1559.getSignPayload(envelope_signed)
    expect(hash_presign).toEqual(hash)
  }
})
