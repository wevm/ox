import { TransactionEnvelopeEip2930, Value } from 'ox'
import { expect, test } from 'vitest'
import { anvilMainnet } from '../../../../test/anvil.js'
import { accounts } from '../../../../test/constants/accounts.js'

test('default', () => {
  const transaction = TransactionEnvelopeEip2930.toRpc({
    chainId: 1,
    nonce: 0n,
    gas: 21000n,
    gasPrice: Value.fromGwei('10'),
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
      "gasPrice": "0x02540be400",
      "nonce": "0x00",
      "r": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "s": "0x0000000000000000000000000000000000000000000000000000000000000002",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x1",
      "value": "0x0de0b6b3a7640000",
      "yParity": "0x0",
    }
  `)
})

test('behavior: nullish', () => {
  const transaction = TransactionEnvelopeEip2930.toRpc({
    chainId: 1,
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  })
  expect(transaction).toMatchInlineSnapshot(`
    {
      "chainId": "0x01",
      "data": undefined,
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x1",
    }
  `)
})

test('behavior: network', async () => {
  const nonce = await anvilMainnet.request({
    method: 'eth_getTransactionCount',
    params: [accounts[0].address, 'pending'],
  })

  const transaction = TransactionEnvelopeEip2930.from({
    chainId: 1,
    nonce: BigInt(nonce),
    gas: 21000n,
    gasPrice: Value.fromGwei('10'),
    from: accounts[0].address,
    to: accounts[1].address,
    value: Value.fromEther('1'),
  })

  const rpc = TransactionEnvelopeEip2930.toRpc(transaction)

  const hash = await anvilMainnet.request({
    method: 'eth_sendTransaction',
    params: [rpc],
  })

  expect(hash).toMatchInlineSnapshot(
    `"0x3abd5f1feb4598f71e8bce577a48b76a194e483d043888bfeaf59c4a603c926b"`,
  )

  const tx = await anvilMainnet.request({
    method: 'eth_getTransactionByHash',
    params: [hash],
  })

  expect(tx).toMatchInlineSnapshot(`
    {
      "accessList": [],
      "blockHash": "0x81727b5339b2899546776ec8cd8d35c47417eba4247c8f379780a9f3d5dbfbfa",
      "blockNumber": "0x12f2975",
      "chainId": "0x1",
      "from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "gas": "0x5208",
      "gasPrice": "0x2540be400",
      "hash": "0x3abd5f1feb4598f71e8bce577a48b76a194e483d043888bfeaf59c4a603c926b",
      "input": "0x",
      "nonce": "0x297",
      "r": "0x65eb2e814e2d0bc71107740c694706e44264850a68421d1b02cd7342f41aee75",
      "s": "0x7c29b61014e58a6a2464ac5c48ec8c4135e4d95262355b634f57ff934caa52a",
      "to": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "transactionIndex": "0x0",
      "type": "0x1",
      "v": "0x1",
      "value": "0xde0b6b3a7640000",
      "yParity": "0x1",
    }
  `)
})
