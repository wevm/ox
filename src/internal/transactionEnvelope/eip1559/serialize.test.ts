import { Secp256k1, TransactionEnvelopeEip1559, Value } from 'ox'
import { assertType, expect, test } from 'vitest'
import { anvilMainnet } from '../../../../test/anvil.js'
import { accounts } from '../../../../test/constants/accounts.js'
import { request } from '../../../../test/request.js'

const transaction = TransactionEnvelopeEip1559.from({
  chainId: 1,
  nonce: 785n,
  to: accounts[1].address,
  value: Value.fromEther('1'),
  maxFeePerGas: Value.fromGwei('2'),
  maxPriorityFeePerGas: Value.fromGwei('2'),
})

test('default', async () => {
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

test('behavior: network', async () => {
  const transaction = TransactionEnvelopeEip1559.from({
    chainId: 1,
    nonce: 663n,
    gas: 21000n,
    to: accounts[1].address,
    value: Value.fromEther('1'),
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
  })

  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip1559.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })

  const serialized_signed = TransactionEnvelopeEip1559.serialize(transaction, {
    signature,
  })

  const hash = await anvilMainnet.request({
    method: 'eth_sendRawTransaction',
    params: [serialized_signed],
  })

  expect(hash).toMatchInlineSnapshot(
    `"0x01622b14f0eb2830d990e71dbac79267a233980df14d632e05e58e451c93bf5c"`,
  )

  await anvilMainnet.request({
    method: 'anvil_mine',
    params: ['0x1', '0x0'],
  })

  const response = await anvilMainnet.request({
    method: 'eth_getTransactionReceipt',
    params: [hash],
  })

  expect(response).toMatchInlineSnapshot(`
    {
      "blobGasPrice": "0x1",
      "blockHash": "0x7b7a9129b1b94f9aa3d52ae696d3005b74bea426844850bb456ae9e3a493a78e",
      "blockNumber": "0x12f2975",
      "contractAddress": null,
      "cumulativeGasUsed": "0x5208",
      "effectiveGasPrice": "0x45840214c",
      "from": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "gasUsed": "0x5208",
      "logs": [],
      "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "root": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "status": "0x1",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "transactionHash": "0x01622b14f0eb2830d990e71dbac79267a233980df14d632e05e58e451c93bf5c",
      "transactionIndex": "0x0",
      "type": "0x2",
    }
  `)
})
