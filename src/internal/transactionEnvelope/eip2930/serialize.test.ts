import {
  Secp256k1,
  TransactionEnvelope,
  TransactionEnvelopeEip2930,
  Value,
} from 'ox'
import { assertType, expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'

const transaction = TransactionEnvelopeEip2930.from({
  gasPrice: Value.fromGwei('2'),
  nonce: 785n,
  to: accounts[1].address,
  value: Value.fromEther('1'),
  chainId: 1,
  accessList: [
    {
      address: '0x1234512345123451234512345123451234512345',
      storageKeys: [
        '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
      ],
    },
  ],
})

test('default', () => {
  const serialized = TransactionEnvelopeEip2930.serialize(transaction)
  assertType<TransactionEnvelopeEip2930.Serialized>(serialized)
  expect(serialized).toEqual(
    '0x01f863018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('default (all zeros)', () => {
  const transaction = TransactionEnvelopeEip2930.from({
    to: accounts[1].address,
    nonce: 0n,
    chainId: 1,
    value: 0n,
    gasPrice: 0n,
    accessList: [],
  })

  const serialized = TransactionEnvelopeEip2930.serialize(transaction)

  expect(serialized).toEqual(
    '0x01dc018080809470997970c51812dc3a010c7d01b50e0d17dc79c88080c0',
  )
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual({
    chainId: 1,
    to: accounts[1].address,
    type: 'eip2930',
  })
})

test('minimal', () => {
  const transaction = TransactionEnvelopeEip2930.from({
    chainId: 1,
  })
  const serialized = TransactionEnvelopeEip2930.serialize(transaction)
  expect(serialized).toEqual('0x01c801808080808080c0')
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual({
    chainId: 1,
    type: 'eip2930',
  })
})

test('minimal (w/ accessList & gasPrice)', () => {
  const transaction = TransactionEnvelopeEip2930.from({
    chainId: 1,
    accessList: [
      {
        address: '0x0000000000000000000000000000000000000000',
        storageKeys: [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        ],
      },
    ],
    gasPrice: Value.fromGwei('2'),
  })
  const serialized = TransactionEnvelopeEip2930.serialize(transaction)
  expect(serialized).toEqual(
    '0x01f8450180847735940080808080f838f7940000000000000000000000000000000000000000e1a00000000000000000000000000000000000000000000000000000000000000001',
  )
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('gas', () => {
  const transaction_gas = TransactionEnvelopeEip2930.from({
    ...transaction,
    gas: 21001n,
  })
  const serialized = TransactionEnvelopeEip2930.serialize(transaction_gas)
  expect(serialized).toEqual(
    '0x01f8650182031184773594008252099470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual(
    transaction_gas,
  )
})

test('data', () => {
  const transaction_data = TransactionEnvelopeEip2930.from({
    ...transaction,
    data: '0x1234',
  })
  const serialized = TransactionEnvelopeEip2930.serialize(transaction_data)
  expect(serialized).toEqual(
    '0x01f865018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000821234f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual(
    transaction_data,
  )
})

test('options: signature', async () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelope.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeEip2930.serialize(transaction, {
    signature,
  })
  expect(serialized).toEqual(
    '0x01f8a6018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe01a0dc7b3483c0b183823f07d77247c60678d861080acdc4fb8b9fd131770b475c40a040f16567391132746735aff4d5a3fa5ae42ff3d5d538e341870e0259dc40741a',
  )
  expect(TransactionEnvelopeEip2930.deserialize(serialized)).toEqual({
    ...transaction,
    ...signature,
  })
})

test('options: signature', () => {
  expect(
    TransactionEnvelopeEip2930.serialize(transaction, {
      signature: {
        r: BigInt(
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ),
        s: BigInt(
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ),
        yParity: 1,
      },
    }),
  ).toEqual(
    '0x01f8a6018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe01a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )
  expect(
    TransactionEnvelopeEip2930.serialize(transaction, {
      signature: {
        r: BigInt(
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ),
        s: BigInt(
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ),
        yParity: 0,
      },
    }),
  ).toEqual(
    '0x01f8a6018203118477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f838f7941234512345123451234512345123451234512345e1a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe80a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )
})
