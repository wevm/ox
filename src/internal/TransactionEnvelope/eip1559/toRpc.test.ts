import { TransactionEnvelopeEip1559, Value } from 'ox'
import { expect, test } from 'vitest'
import { anvilMainnet } from '../../../../test/anvil.js'
import { accounts } from '../../../../test/constants/accounts.js'

test('default', () => {
  const transaction = TransactionEnvelopeEip1559.toRpc({
    chainId: 1,
    nonce: 0n,
    maxFeePerGas: 1000000000n,
    gas: 21000n,
    maxPriorityFeePerGas: 100000000n,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    value: 1000000000000000000n,
    r: 1n,
    s: 2n,
    yParity: 0,
  })
  expect(transaction).toMatchInlineSnapshot(`
    {
      "chainId": "0x01",
      "data": undefined,
      "gas": "0x5208",
      "maxFeePerGas": "0x3b9aca00",
      "maxPriorityFeePerGas": "0x05f5e100",
      "nonce": "0x00",
      "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x2",
      "value": "0x0de0b6b3a7640000",
      "yParity": "0x0",
    }
  `)
})

test('behavior: nullish', () => {
  const transaction = TransactionEnvelopeEip1559.toRpc({
    chainId: 1,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  })
  expect(transaction).toMatchInlineSnapshot(`
    {
      "chainId": "0x01",
      "data": undefined,
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x2",
    }
  `)
})

test('behavior: network', async () => {
  const nonce = await anvilMainnet.request({
    method: 'eth_getTransactionCount',
    params: [accounts[0].address, 'pending'],
  })

  const transaction = TransactionEnvelopeEip1559.from({
    chainId: 1,
    nonce: BigInt(nonce),
    gas: 21000n,
    from: accounts[0].address,
    to: accounts[1].address,
    value: Value.fromEther('1'),
  })

  const rpc = TransactionEnvelopeEip1559.toRpc(transaction)

  const hash = await anvilMainnet.request({
    method: 'eth_sendTransaction',
    params: [rpc],
  })

  expect(hash).toMatchInlineSnapshot(
    `"0x7818e87e5d2bc021d109f81e0b40e06f5dcc845399cd77f4cf67cbcaafdae5f3"`,
  )

  const tx = await anvilMainnet.request({
    method: 'eth_getTransactionByHash',
    params: [hash],
  })

  expect({ ...tx, blockHash: null }).toMatchInlineSnapshot(`
    {
      "accessList": [],
      "blockHash": null,
      "blockNumber": "0x12f2975",
      "chainId": "0x1",
      "from": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "gas": "0x5208",
      "gasPrice": "0x204343d4c",
      "hash": "0x7818e87e5d2bc021d109f81e0b40e06f5dcc845399cd77f4cf67cbcaafdae5f3",
      "input": "0x",
      "maxFeePerGas": "0x23fcf074c",
      "maxPriorityFeePerGas": "0x0",
      "nonce": "0x297",
      "r": "0xc667a6af335d6d274047511d06fd9222512c42fb1f5ef2635b4551cb4a1f992a",
      "s": "0x258e6b2ae77cac54cca418320d1a0d12fe4baa65c8ac256d7bef6fa28c3ded00",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "transactionIndex": "0x0",
      "type": "0x2",
      "v": "0x0",
      "value": "0xde0b6b3a7640000",
      "yParity": "0x0",
    }
  `)
})
