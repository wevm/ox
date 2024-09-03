import { Blobs, Hex, Secp256k1, TransactionEnvelopeEip4844, Value } from 'ox'
import { assertType, expect, test } from 'vitest'
import { anvilMainnet } from '../../../../test/anvil.js'
import { accounts } from '../../../../test/constants/accounts.js'
import { kzg } from '../../../../test/kzg.js'

const blobs = Blobs.from(Hex.from('abcd'))
const sidecars = Blobs.toSidecars(blobs, { kzg })
const blobVersionedHashes = Blobs.sidecarsToVersionedHashes(sidecars)
const transaction = TransactionEnvelopeEip4844.from({
  chainId: 1,
  nonce: 785n,
  to: accounts[1].address,
  value: Value.fromEther('1'),
  blobVersionedHashes,
})

test('default', () => {
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  assertType<TransactionEnvelopeEip4844.Serialized>(serialized)
  expect(serialized).toEqual(
    '0x03f84a018203118080809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261',
  )
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('minimal', () => {
  const transaction = TransactionEnvelopeEip4844.from({
    blobVersionedHashes,
    chainId: 1,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  expect(serialized).toMatchInlineSnapshot(
    `"0x03ec0180808080808080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
  )
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('fees', () => {
  const transaction = TransactionEnvelopeEip4844.from({
    chainId: 1,
    blobVersionedHashes,
    maxFeePerBlobGas: Value.fromGwei('20'),
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('1'),
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  expect(serialized).toMatchInlineSnapshot(
    `"0x03f83a0180843b9aca008504a817c80080808080c08504a817c800e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
  )
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('fees', () => {
  const transaction = TransactionEnvelopeEip4844.from({
    chainId: 1,
    blobVersionedHashes,
    gas: 69420n,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  expect(serialized).toMatchInlineSnapshot(
    `"0x03ef0180808083010f2c808080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed80261"`,
  )
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('no blobVersionedHashes', () => {
  // @ts-expect-error
  const transaction = TransactionEnvelopeEip4844.from({
    chainId: 1,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction)
  expect(serialized).toMatchInlineSnapshot(`"0x03cb0180808080808080c080c0"`)
})

test('options: signature', async () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip4844.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction, {
    signature,
  })
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual({
    ...transaction,
    ...signature,
  })
})

test('options: signature', () => {
  expect(
    TransactionEnvelopeEip4844.serialize(transaction, {
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
    '0x03f88d018203118080809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed8026101a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )
  expect(
    TransactionEnvelopeEip4844.serialize(
      transaction,

      {
        signature: {
          r: BigInt(
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ),
          s: BigInt(
            '0x60fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
          ),
          yParity: 0,
        },
      },
    ),
  ).toEqual(
    '0x03f88d018203118080809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c080e1a001627c687261b0e7f8638af1112efa8a77e23656f6e7945275b19e9deed8026180a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )
})

test('options: sidecars', () => {
  const serialized = TransactionEnvelopeEip4844.serialize(transaction, {
    sidecars,
  })
  assertType<TransactionEnvelopeEip4844.Serialized>(serialized)
  expect(serialized).toMatchSnapshot()
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual({
    ...transaction,
    sidecars,
  })
})

test('options: signature', async () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip4844.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeEip4844.serialize(transaction, {
    signature,
    sidecars,
  })
  expect(TransactionEnvelopeEip4844.deserialize(serialized)).toEqual({
    ...transaction,
    ...signature,
    sidecars,
  })
})

test('behavior: network', async () => {
  const nonce = await anvilMainnet.request({
    method: 'eth_getTransactionCount',
    params: [accounts[0].address, 'pending'],
  })

  const blobs = Blobs.from('0xdeadbeef')
  const sidecars = Blobs.toSidecars(blobs, { kzg })
  const blobVersionedHashes = Blobs.sidecarsToVersionedHashes(sidecars)

  const transaction = TransactionEnvelopeEip4844.from({
    blobVersionedHashes,
    chainId: 1,
    nonce: BigInt(nonce),
    gas: 1_000_000n,
    to: accounts[1].address,
    value: Value.fromEther('1'),
    maxFeePerBlobGas: Value.fromGwei('30'),
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
  })

  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip4844.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })

  const serialized_signed = TransactionEnvelopeEip4844.serialize(transaction, {
    sidecars,
    signature,
  })

  const hash = await anvilMainnet.request({
    method: 'eth_sendRawTransaction',
    params: [serialized_signed],
  })

  expect(hash).toMatchInlineSnapshot(
    `"0x8d3abb1bf4ae91f9be05bd3992eeb39f33498acf050d6f2d6231e470dd42221b"`,
  )

  await anvilMainnet.request({
    method: 'anvil_mine',
    params: ['0x1', '0x0'],
  })

  const tx = await anvilMainnet.request({
    method: 'eth_getTransactionByHash',
    params: [hash],
  })

  expect({ ...tx, blockHash: undefined }).toMatchInlineSnapshot(`
    {
      "accessList": [],
      "blobVersionedHashes": [
        "0x01a24709d3997e8b217fe5460aef10ee515513ceba0362bf2d02a3ba73d7cb09",
      ],
      "blockHash": undefined,
      "blockNumber": "0x12f2975",
      "chainId": "0x1",
      "from": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "gas": "0xf4240",
      "gasPrice": "0x45840214c",
      "hash": "0x8d3abb1bf4ae91f9be05bd3992eeb39f33498acf050d6f2d6231e470dd42221b",
      "input": "0x",
      "maxFeePerBlobGas": "0x6fc23ac00",
      "maxFeePerGas": "0x4a817c800",
      "maxPriorityFeePerGas": "0x2540be400",
      "nonce": "0x297",
      "r": "0xf708bb3c460ae43b380cf8bfe84b3c8ba3824be44a6d9275725ad22ae0abae3f",
      "s": "0x34dca8d9a70e913ab0bde3a84ab4993d369792a1a55d33bd8682c3c152536ce3",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "transactionIndex": "0x0",
      "type": "0x3",
      "v": "0x0",
      "value": "0xde0b6b3a7640000",
      "yParity": "0x0",
    }
  `)

  const receipt = await anvilMainnet.request({
    method: 'eth_getTransactionReceipt',
    params: [hash],
  })

  expect({ ...receipt, blockHash: undefined }).toMatchInlineSnapshot(`
    {
      "blobGasPrice": "0x1",
      "blobGasUsed": "0x20000",
      "blockHash": undefined,
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
      "transactionHash": "0x8d3abb1bf4ae91f9be05bd3992eeb39f33498acf050d6f2d6231e470dd42221b",
      "transactionIndex": "0x0",
      "type": "0x3",
    }
  `)
})
