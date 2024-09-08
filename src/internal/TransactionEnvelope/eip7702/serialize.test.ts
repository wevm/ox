import {
  Authorization,
  Secp256k1,
  TransactionEnvelope,
  TransactionEnvelopeEip7702,
  Value,
} from 'ox'
import { assertType, expect, test } from 'vitest'
import { anvilMainnet } from '../../../../test/anvil.js'
import { wagmiContractConfig } from '../../../../test/constants/abis.js'
import { accounts } from '../../../../test/constants/accounts.js'

const authorization_1 = Authorization.from({
  chainId: 1,
  contractAddress: wagmiContractConfig.address,
  nonce: 785n,
})
const signature_1 = Secp256k1.sign({
  payload: Authorization.getSignPayload(authorization_1),
  privateKey: accounts[0].privateKey,
})

const authorization_2 = Authorization.from({
  chainId: 10,
  contractAddress: wagmiContractConfig.address,
  nonce: 786n,
})
const signature_2 = Secp256k1.sign({
  payload: Authorization.getSignPayload(authorization_2),
  privateKey: accounts[0].privateKey,
})

const transaction = TransactionEnvelopeEip7702.from({
  authorizationList: [
    Authorization.from(authorization_1, { signature: signature_1 }),
    Authorization.from(authorization_2, { signature: signature_2 }),
  ],
  chainId: 1,
  nonce: 785n,
  to: accounts[1].address,
  value: Value.fromEther('1'),
  maxFeePerGas: Value.fromGwei('2'),
  maxPriorityFeePerGas: Value.fromGwei('2'),
})

test('default', () => {
  const serialized = TransactionEnvelopeEip7702.serialize(transaction)
  assertType<TransactionEnvelopeEip7702.Serialized>(serialized)
  expect(serialized).toEqual(
    '0x04f8ed0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc9582',
  )
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('default (all zeros)', () => {
  const transaction = TransactionEnvelopeEip7702.from({
    authorizationList: [],
    to: undefined,
    nonce: 0n,
    chainId: 1,
    maxFeePerGas: 0n,
    maxPriorityFeePerGas: 0n,
    value: 0n,
  })

  const serialized = TransactionEnvelopeEip7702.serialize(transaction)

  expect(serialized).toEqual('0x04ca0180808080808080c0c0')
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual({
    authorizationList: [],
    chainId: 1,
    type: 'eip7702',
  })
})

test('minimal (w/ type)', () => {
  const transaction = TransactionEnvelopeEip7702.from({
    authorizationList: [],
    chainId: 1,
  })
  const serialized = TransactionEnvelopeEip7702.serialize(transaction)
  expect(serialized).toEqual('0x04ca0180808080808080c0c0')
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('minimal (w/ maxFeePerGas)', () => {
  const transaction = TransactionEnvelopeEip7702.from({
    authorizationList: [],
    chainId: 1,
    maxFeePerGas: 1n,
  })
  const serialized = TransactionEnvelopeEip7702.serialize(transaction)
  expect(serialized).toEqual('0x04ca0180800180808080c0c0')
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
    transaction,
  )
})

test('gas', () => {
  const transaction_gas = TransactionEnvelopeEip7702.from({
    ...transaction,
    gas: 21001n,
  })
  const serialized = TransactionEnvelopeEip7702.serialize(transaction_gas)
  expect(serialized).toEqual(
    '0x04f8ef01820311847735940084773594008252099470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc9582',
  )
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
    transaction_gas,
  )
})

test('accessList', () => {
  const transaction_accessList = TransactionEnvelopeEip7702.from({
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
  const serialized = TransactionEnvelopeEip7702.serialize(
    transaction_accessList,
  )
  expect(serialized).toEqual(
    '0x04f901490182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080f85bf859940000000000000000000000000000000000000000f842a00000000000000000000000000000000000000000000000000000000000000001a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fef8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc9582',
  )
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
    transaction_accessList,
  )
})

test('data', () => {
  const transaction_data = TransactionEnvelopeEip7702.from({
    ...transaction,
    data: '0x1234',
  })
  const serialized = TransactionEnvelopeEip7702.serialize(transaction_data)
  expect(serialized).toEqual(
    '0x04f8ef0182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a7640000821234c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc9582',
  )
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual(
    transaction_data,
  )
})

test('options: signature', async () => {
  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip7702.getSignPayload(transaction),
    privateKey: accounts[0].privateKey,
  })
  const serialized = TransactionEnvelopeEip7702.serialize(transaction, {
    signature,
  })
  expect(serialized).toEqual(
    '0x04f901300182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc958280a0c6e17df66749225c040251e51ab7c732b7c92d7844ed731c80ee5ff3b15baf42a03b4fb995198301b08f630d1aecfa4a567a722e184eda6e3789481091a0cd1dd5',
  )
  expect(TransactionEnvelopeEip7702.deserialize(serialized)).toEqual({
    ...transaction,
    ...signature,
  })
})

test('options: signature', () => {
  expect(
    TransactionEnvelopeEip7702.serialize(transaction, {
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
    '0x04f901300182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc958201a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )

  expect(
    TransactionEnvelopeEip7702.serialize(transaction, {
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
    '0x04f901300182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc958280a060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fea060fdd29ff912ce880cd3edaf9f932dc61d3dae823ea77e0323f94adb9f6a72fe',
  )

  expect(
    TransactionEnvelopeEip7702.serialize(transaction, {
      signature: {
        r: 0n,
        s: 0n,
        yParity: 0,
      },
    }),
  ).toEqual(
    '0x04f8f00182031184773594008477359400809470997970c51812dc3a010c7d01b50e0d17dc79c8880de0b6b3a764000080c0f8bcf85c0194fba3912ca04dd458c843e2ee08967fc04f3579c282031101a05f9eab9d5d717098430d03780924a379e350e5cdd38fb7ffe707393d587e4e35a07e28e4c4eadc81dafea5d73c8e5327034306d4ad2dc4dbd94ef829bec57f04dbf85c0a94fba3912ca04dd458c843e2ee08967fc04f3579c282031280a0f4181dd27f6b801404cd3bc24207aa1b07b1ff8991ea847b0af1a6c3e4ba9e99a00fda7db5a05f0c5298339ffa7ec9be2d2a483f5c0af7fe267237b01290bc9582808080',
  )
})

test('behavior: network', async () => {
  const authority = accounts[0]
  const invoker = accounts[1]

  // Deploy delegate contract
  const contractAddress = await (async () => {
    const nonce = await anvilMainnet.request({
      method: 'eth_getTransactionCount',
      params: [authority.address, 'pending'],
    })

    const envelope = TransactionEnvelope.from({
      chainId: 1,
      nonce: BigInt(nonce),
      gas: 3_000_000n,
      data: '0x66365f5f37365fa05f5260076019f3',
      maxFeePerGas: Value.fromGwei('20'),
      maxPriorityFeePerGas: Value.fromGwei('10'),
    })

    const signature = Secp256k1.sign({
      payload: TransactionEnvelope.getSignPayload(envelope),
      privateKey: authority.privateKey,
    })

    const serialized = TransactionEnvelope.serialize(envelope, {
      signature,
    })

    const hash = await anvilMainnet.request({
      method: 'eth_sendRawTransaction',
      params: [serialized],
    })

    await anvilMainnet.request({
      method: 'anvil_mine',
      params: ['0x1', '0x0'],
    })

    const receipt = await anvilMainnet.request({
      method: 'eth_getTransactionReceipt',
      params: [hash],
    })
    return receipt!.contractAddress
  })()

  // Authorize injection of delegate contract onto authority
  const authorization = await (async () => {
    const nonce = await anvilMainnet.request({
      method: 'eth_getTransactionCount',
      params: [authority.address, 'pending'],
    })

    const authorization = Authorization.from({
      chainId: 1,
      contractAddress: contractAddress!,
      nonce: BigInt(nonce),
    })

    const signature = Secp256k1.sign({
      payload: Authorization.getSignPayload(authorization),
      privateKey: authority.privateKey,
    })

    return Authorization.from(authorization, { signature })
  })()

  const nonce = await anvilMainnet.request({
    method: 'eth_getTransactionCount',
    params: [invoker.address, 'pending'],
  })

  const envelope = TransactionEnvelopeEip7702.from({
    chainId: 1,
    authorizationList: [authorization],
    data: '0xdeadbeef',
    nonce: BigInt(nonce),
    gas: 1_000_000n,
    to: authority.address,
    maxFeePerGas: Value.fromGwei('20'),
    maxPriorityFeePerGas: Value.fromGwei('10'),
  })

  const signature = Secp256k1.sign({
    payload: TransactionEnvelopeEip7702.getSignPayload(envelope),
    privateKey: invoker.privateKey,
  })

  const serialized = TransactionEnvelopeEip7702.serialize(envelope, {
    signature,
  })

  const hash = await anvilMainnet.request({
    method: 'eth_sendRawTransaction',
    params: [serialized],
  })

  const tx = await anvilMainnet.request({
    method: 'eth_getTransactionByHash',
    params: [hash],
  })

  expect(tx).toMatchInlineSnapshot(`
    {
      "accessList": [],
      "authorizationList": [
        {
          "address": "0xbd2fe040d03eb1d1e5a151fbcc19a03333223019",
          "chainId": "0x1",
          "nonce": "0x298",
          "r": "0xb7ba3c862bb67758a231b9f4c031f275fa3eeb436a8fd8312eda06e3b1931deb",
          "s": "0x482c735314968a46724bcdf464047bb3d0317fc1a9bb22a9581b399090829a8e",
          "yParity": "0x0",
        },
      ],
      "blockHash": "0xdd2a2f7f3e6fd6ba0883414032d3942cd87d5b6d99e5c68100e2f5e759f8222d",
      "blockNumber": "0x12f2977",
      "chainId": "0x1",
      "from": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "gas": "0xf4240",
      "gasPrice": "0x3df788e0a",
      "hash": "0xf269fd6abf599d69890284759f77fc1c14f277d4b396689ff1ecc0072e7abdc0",
      "input": "0xdeadbeef",
      "maxFeePerGas": "0x4a817c800",
      "maxPriorityFeePerGas": "0x2540be400",
      "nonce": "0x70",
      "r": "0xfba1d00a6da7a7b1faabf2a3cfdab43c451156c47f4f504b00f8013dcead8312",
      "s": "0x44dad3618977b47f57f0cf2237c4d16bcf5a509a1d191fbfe0ac6198e5bc6658",
      "to": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "transactionIndex": "0x0",
      "type": "0x4",
      "v": "0x0",
      "value": "0x0",
      "yParity": "0x0",
    }
  `)

  const receipt = await anvilMainnet.request({
    method: 'eth_getTransactionReceipt',
    params: [hash],
  })

  expect({ ...receipt, blockHash: null }).toMatchInlineSnapshot(`
    {
      "blobGasPrice": "0x1",
      "blockHash": null,
      "blockNumber": "0x12f2977",
      "contractAddress": null,
      "cumulativeGasUsed": "0x4af8",
      "effectiveGasPrice": "0x3df788e0a",
      "from": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "gasUsed": "0x4af8",
      "logs": [
        {
          "address": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
          "blockHash": "0xdd2a2f7f3e6fd6ba0883414032d3942cd87d5b6d99e5c68100e2f5e759f8222d",
          "blockNumber": "0x12f2977",
          "blockTimestamp": "0x66434e46",
          "data": "0xdeadbeef",
          "logIndex": "0x0",
          "removed": false,
          "topics": [],
          "transactionHash": "0xf269fd6abf599d69890284759f77fc1c14f277d4b396689ff1ecc0072e7abdc0",
          "transactionIndex": "0x0",
        },
      ],
      "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "root": "0x0000000000000000000000000000000000000000000000000000000000000000",
      "status": "0x1",
      "to": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "transactionHash": "0xf269fd6abf599d69890284759f77fc1c14f277d4b396689ff1ecc0072e7abdc0",
      "transactionIndex": "0x0",
      "type": "0x4",
    }
  `)
})
