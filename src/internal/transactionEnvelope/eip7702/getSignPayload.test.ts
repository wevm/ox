import { Authorization, Secp256k1, TransactionEnvelopeEip7702 } from 'ox'
import { expect, test } from 'vitest'
import { wagmiContractConfig } from '../../../../test/constants/abis.js'
import { accounts } from '../../../../test/constants/accounts.js'

test('default', () => {
  const authorization = Authorization.from({
    chainId: 1,
    contractAddress: wagmiContractConfig.address,
    nonce: 785n,
  })
  const signature = Secp256k1.sign({
    payload: Authorization.getSignPayload(authorization),
    privateKey: accounts[0].privateKey,
  })

  const envelope = TransactionEnvelopeEip7702.from({
    authorizationList: [Authorization.from(authorization, { signature })],
    chainId: 1,
    gas: 21000n,
    maxFeePerGas: 13000000000n,
    maxPriorityFeePerGas: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  })

  const hash = TransactionEnvelopeEip7702.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0x6458c62f981287bcbf1c85861e69de9c7344793116dc9388d90274ab153da8d8"`,
  )

  const signature_tx = Secp256k1.sign({
    payload: TransactionEnvelopeEip7702.getSignPayload(envelope),
    privateKey: accounts[0].privateKey,
  })

  const envelope_signed = TransactionEnvelopeEip7702.from(envelope, {
    signature: signature_tx,
  })

  {
    const hash = TransactionEnvelopeEip7702.hash(envelope_signed)
    expect(hash).toMatchInlineSnapshot(
      `"0x9714058a95376ce5963b33200dce2fb3afc6ebbefd47a65d9d137c0f66a5e7bf"`,
    )
  }
  {
    const hash_presign =
      TransactionEnvelopeEip7702.getSignPayload(envelope_signed)
    expect(hash_presign).toEqual(hash)
  }
})
