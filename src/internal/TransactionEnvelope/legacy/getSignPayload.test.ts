import { Secp256k1, TransactionEnvelopeLegacy } from 'ox'
import { expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'

test('default', () => {
  const envelope = TransactionEnvelopeLegacy.from({
    chainId: 1,
    gas: 21000n,
    gasPrice: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'legacy',
  })

  const hash = TransactionEnvelopeLegacy.hash(envelope, { presign: true })
  expect(hash).toMatchInlineSnapshot(
    `"0x4c1dec0d90aa1a17cb0aa735b5550e43a1bd27cd1cacb8987522576fa6220e46"`,
  )

  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeLegacy.getSignPayload(envelope),
    privateKey: accounts[0].privateKey,
  })

  const envelope_signed = TransactionEnvelopeLegacy.from(envelope, {
    signature,
  })

  {
    const hash = TransactionEnvelopeLegacy.hash(envelope_signed)
    expect(hash).toMatchInlineSnapshot(
      `"0x882958af32ef451898e54afcaa1c5bb56e5dff1bf47ac9d1b47751bd0b6c8ec8"`,
    )
  }
  {
    const hash_presign =
      TransactionEnvelopeLegacy.getSignPayload(envelope_signed)
    expect(hash_presign).toEqual(hash)
  }
})
