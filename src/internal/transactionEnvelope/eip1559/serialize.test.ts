import { Secp256k1, TransactionEnvelopeEip1559, Value } from 'ox'
import { assertType, expect, test } from 'vitest'
import { accounts } from '../../../../test/constants/accounts.js'

const transaction = TransactionEnvelopeEip1559.from({
  chainId: 1,
  nonce: 785n,
  to: accounts[1].address,
  value: Value.fromEther('1'),
  maxFeePerGas: Value.fromGwei('2'),
  maxPriorityFeePerGas: Value.fromGwei('2'),
})

test('default', () => {
  const serialized = TransactionEnvelopeEip1559.serialize(transaction)
  assertType<TransactionEnvelopeEip1559.Serialized>(serialized)
  expect(serialized).toEqual(
    '0x02ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0',
  )
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('default (all zeros)', () => {
  const transaction = TransactionEnvelopeEip1559.from({
    to: accounts[1].address,
    nonce: 0n,
    chainId: 1,
    maxFeePerGas: 0n,
    maxPriorityFeePerGas: 0n,
    value: 0n,
  })

  const serialized = TransactionEnvelopeEip1559.serialize(transaction)

  expect(serialized).toEqual(
    '0x02dd01808080809470997970c51812dc3a010c7d01b50e0d17dc79c88080c0',
  )
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual({
    chainId: 1,
    to: accounts[1].address,
    type: 'eip1559',
  })
})

test('minimal (w/ type)', () => {
  const transaction = TransactionEnvelopeEip1559.from({
    chainId: 1,
  })
  const serialized = TransactionEnvelopeEip1559.serialize(transaction)
  expect(serialized).toEqual('0x02c90180808080808080c0')
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('minimal (w/ maxFeePerGas)', () => {
  const transaction = TransactionEnvelopeEip1559.from({
    chainId: 1,
    maxFeePerGas: 1n,
  })
  const serialized = TransactionEnvelopeEip1559.serialize(transaction)
  expect(serialized).toEqual('0x02c90180800180808080c0')
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('gas', () => {
  const transaction_gas = TransactionEnvelopeEip1559.from({
    ...transaction,
    gas: 21001n,
  })
  const serialized = TransactionEnvelopeEip1559.serialize(transaction_gas)
  expect(serialized).toEqual(
    '0x02f101820311847735940084773594008252099470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0',
  )
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
    transaction_gas,
  )
})

test('accessList', () => {
  const transaction_accessList = TransactionEnvelopeEip1559.from({
    ...transaction,
    accessList: [
      {
        address: '0x0000000000000000000000000000000000000000',
        storageKeys: [
          '0x0000000000000000000000000000000000000000000000000000000000000001',
          '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
        ],
      },
    ],
  })
  const serialized = TransactionEnvelopeEip1559.serialize(
    transaction_accessList,
  )
  expect(serialized).toEqual(
    '0x02f88b0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f85bf859940000000000000000000000000000000000000000f842a00000000000000000000000000000000000000000000000000000000000000001a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
    transaction_accessList,
  )
})

test('data', () => {
  const transaction_data = {
    ...transaction,
    data: '0x1234',
  } satisfies TransactionEnvelopeEip1559.TransactionEnvelope
  const serialized = TransactionEnvelopeEip1559.serialize(transaction_data)
  expect(serialized).toEqual(
    '0x02f10182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000821234c0',
  )
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual(
    transaction_data,
  )
})

test('options: signature', async () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip1559.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeEip1559.serialize(transaction, {
    signature,
  })
  expect(serialized).toEqual(
    '0x02f8720182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c001a0ce18214ff9d06ecaacb61811f9d6dc2be922e8cebddeaf6df0b30d5c498f6d33a05f0487c6dbbf2139f7c705d8054dbb16ecac8ae6256ce2c4c6f2e7ef35b3a496',
  )
  expect(TransactionEnvelopeEip1559.deserialize(serialized)).toEqual({
    ...transaction,
    ...signature,
  })
})

test('options: signature', () => {
  expect(
    TransactionEnvelopeEip1559.serialize(transaction, {
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
    '0x02f8720182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c001a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )

  expect(
    TransactionEnvelopeEip1559.serialize(transaction, {
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
    '0x02f8720182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c080a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )

  expect(
    TransactionEnvelopeEip1559.serialize(transaction, {
      signature: {
        r: 0n,
        s: 0n,
        yParity: 0,
      },
    }),
  ).toEqual(
    '0x02f20182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0808080',
  )
})

test('behavior: legacy signature', () => {
  const serialized = TransactionEnvelopeEip1559.serialize({
    ...transaction,
    r: 0n,
    s: 0n,
    v: 27,
  })
  const serialized2 = TransactionEnvelopeEip1559.serialize({
    ...transaction,
    r: 0n,
    s: 0n,
    yParity: 0,
  })
  expect(serialized).toEqual(serialized2)
})
