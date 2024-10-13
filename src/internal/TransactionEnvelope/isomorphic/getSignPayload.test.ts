import { Authorization, Secp256k1, TransactionEnvelope } from 'ox'
import { expect, test } from 'vitest'
import { wagmiContractConfig } from '../../../../test/constants/abis.js'
import { accounts } from '../../../../test/constants/accounts.js'

test('legacy', () => {
  const envelope = TransactionEnvelope.from({
    chainId: 1,
    gas: 21000n,
    gasPrice: 1000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'legacy',
  })

  const hash = TransactionEnvelope.hash(envelope, { presign: true })
  expect(hash).toMatchInlineSnapshot(
    `"0x4c1dec0d90aa1a17cb0aa735b5550e43a1bd27cd1cacb8987522576fa6220e46"`,
  )

  const signature = Secp256k1.sign({
    payload: TransactionEnvelope.getSignPayload(envelope),
    privateKey: accounts[0].privateKey,
  })

  const envelope_signed = TransactionEnvelope.from(envelope, { signature })

  {
    const hash = TransactionEnvelope.hash(envelope_signed)
    expect(hash).toMatchInlineSnapshot(
      `"0x882958af32ef451898e54afcaa1c5bb56e5dff1bf47ac9d1b47751bd0b6c8ec8"`,
    )
  }
  {
    const hash_presign = TransactionEnvelope.getSignPayload(envelope_signed)
    expect(hash_presign).toEqual(hash)
  }
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
  })

  const hash = TransactionEnvelope.hash(envelope as any)
  expect(hash).toMatchInlineSnapshot(
    `"0x1d099d1f25465b53e1e56e715e35d5daaaef6a9e9883ba21652eea7f411fffc7"`,
  )

  const signature = Secp256k1.sign({
    payload: TransactionEnvelope.getSignPayload(envelope),
    privateKey: accounts[0].privateKey,
  })

  const envelope_signed = TransactionEnvelope.from(envelope, { signature })

  {
    const hash = TransactionEnvelope.hash(envelope_signed)
    expect(hash).toMatchInlineSnapshot(
      `"0x57e6a86fac2dc4b827f6d77d869d625aebf88a71790a740bc859badf556d43c4"`,
    )
  }
  {
    const hash_presign = TransactionEnvelope.getSignPayload(envelope_signed)
    expect(hash_presign).toEqual(hash)
  }
})

test('eip2930', () => {
  const envelope = TransactionEnvelope.from({
    chainId: 1,
    gas: 21000n,
    gasPrice: 13000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'eip2930',
  })

  const hash = TransactionEnvelope.hash(envelope)
  expect(hash).toMatchInlineSnapshot(
    `"0x7604c4fa324a1945c8d960f0ec0554434b749c597bcb7d1ddbc1614bad9feca3"`,
  )

  const signature = Secp256k1.sign({
    payload: TransactionEnvelope.getSignPayload(envelope),
    privateKey: accounts[0].privateKey,
  })

  const envelope_signed = TransactionEnvelope.from(envelope, { signature })

  {
    const hash = TransactionEnvelope.hash(envelope_signed)
    expect(hash).toMatchInlineSnapshot(
      `"0x6fb8b1dd822896cf6b4a7abe9b6de0da9be36a755034494df6374caaca66d920"`,
    )
  }
  {
    const hash_presign = TransactionEnvelope.getSignPayload(envelope_signed)
    expect(hash_presign).toEqual(hash)
  }
})

test('eip4844', () => {
  const envelope = TransactionEnvelope.from({
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

  const hash = TransactionEnvelope.hash(envelope as any)
  expect(hash).toMatchInlineSnapshot(
    `"0xd5c811a922a14455151761e77bcc84bf590bb8dbf2d9a79d4c890f561a6dcd39"`,
  )

  const signature = Secp256k1.sign({
    payload: TransactionEnvelope.getSignPayload(envelope),
    privateKey: accounts[0].privateKey,
  })

  const envelope_signed = TransactionEnvelope.from(envelope, { signature })

  {
    const hash = TransactionEnvelope.hash(envelope_signed)
    expect(hash).toMatchInlineSnapshot(
      `"0xfae853c3fefc9481eb674943ddb34dca24c2959f26d2ce6917d45c8faad684a8"`,
    )
  }
  {
    const hash_presign = TransactionEnvelope.getSignPayload(envelope_signed)
    expect(hash_presign).toEqual(hash)
  }
})

test('eip7702', () => {
  const authorization = Authorization.from({
    address: wagmiContractConfig.address,
    chainId: 1,
    nonce: 785n,
  })
  const signature_auth = Secp256k1.sign({
    payload: Authorization.getSignPayload(authorization),
    privateKey: accounts[0].privateKey,
  })

  const envelope = TransactionEnvelope.from({
    authorizationList: [
      Authorization.from(authorization, { signature: signature_auth }),
    ],
    chainId: 1,
    gas: 21000n,
    maxFeePerGas: 13000000000n,
    nonce: 665n,
    value: 1000000000000000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    type: 'eip7702',
  })

  const hash = TransactionEnvelope.hash(envelope as any)
  expect(hash).toMatchInlineSnapshot(
    `"0x29e23a79291c348f976a6f4b93b9de92d4e6207a8ceea39c7cf717aaae23a2b8"`,
  )

  const signature = Secp256k1.sign({
    payload: TransactionEnvelope.getSignPayload(envelope),
    privateKey: accounts[0].privateKey,
  })

  const envelope_signed = TransactionEnvelope.from(envelope, { signature })

  {
    const hash = TransactionEnvelope.hash(envelope_signed)
    expect(hash).toMatchInlineSnapshot(
      `"0xae33fbf010b3f2cd8af1d8a46228eaf8bdd5d4eb4e0e82b6a796a7127cbb5be0"`,
    )
  }
  {
    const hash_presign = TransactionEnvelope.getSignPayload(envelope_signed)
    expect(hash_presign).toEqual(hash)
  }
})

test('error: not implemented', () => {
  expect(() =>
    TransactionEnvelope.getSignPayload({
      // @ts-expect-error
      type: 'unknown',
    }),
  ).toThrowErrorMatchingInlineSnapshot(
    '[TransactionEnvelope.TypeNotImplementedError: The provided transaction type `unknown` is not implemented.]',
  )
})
