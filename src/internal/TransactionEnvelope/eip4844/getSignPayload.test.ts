import { Secp256k1, TransactionEnvelopeEip4844 } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'

test('default', () => {
  const envelope = TransactionEnvelopeEip4844.from({
    blobVersionedHashes: [
      '0x01febabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe',
    ],
    chainId: 1,
    gas: 21000n,
    maxFeePerGas: 13000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'eip4844',
  })

  const hash = TransactionEnvelopeEip4844.hash(envelope, { presign: true })
  expect(hash).toMatchInlineSnapshot(
    `"0xd5c811a922a14455151761e77bcc84bf590bb8dbf2d9a79d4c890f561a6dcd39"`,
  )

  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip4844.getSignPayload(envelope),
    privateKey: accounts[0].privateKey,
  })

  const envelope_signed = TransactionEnvelopeEip4844.from(envelope, {
    signature,
  })

  {
    const hash = TransactionEnvelopeEip4844.hash(envelope_signed)
    expect(hash).toMatchInlineSnapshot(
      `"0xfae853c3fefc9481eb674943ddb34dca24c2959f26d2ce6917d45c8faad684a8"`,
    )
  }
  {
    const hash_presign =
      TransactionEnvelopeEip4844.getSignPayload(envelope_signed)
    expect(hash_presign).toEqual(hash)
  }
})
