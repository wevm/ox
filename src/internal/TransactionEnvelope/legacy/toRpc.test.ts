import { TransactionEnvelopeLegacy, Value } from 'ox'
import { expect, test } from 'vitest'
import { anvilMainnet } from '../../../../test/anvil.js'
import { accounts } from '../../../../test/constants/accounts.js'

test('default', () => {
  const transaction = TransactionEnvelopeLegacy.toRpc({
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
      "type": "0x0",
      "v": "0x1b",
      "value": "0x0de0b6b3a7640000",
      "yParity": "0x0",
    }
  `)
})

test('behavior: nullish', () => {
  const transaction = TransactionEnvelopeLegacy.toRpc({
    to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  })
  expect(transaction).toMatchInlineSnapshot(`
    {
      "chainId": undefined,
      "data": undefined,
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "type": "0x0",
    }
  `)
})

test('behavior: network', async () => {
  const nonce = await anvilMainnet.request({
    method: 'eth_getTransactionCount',
    params: [accounts[0].address, 'pending'],
  })

  const transaction = TransactionEnvelopeLegacy.from({
    chainId: 1,
    nonce: BigInt(nonce),
    gas: 21000n,
    gasPrice: Value.fromGwei('10'),
    from: accounts[0].address,
    to: accounts[1].address,
    value: Value.fromEther('1'),
  })

  const rpc = TransactionEnvelopeLegacy.toRpc(transaction)

  const hash = await anvilMainnet.request({
    method: 'eth_sendTransaction',
    params: [rpc],
  })

  expect(hash).toMatchInlineSnapshot(
    `"0x431d828c5cfb696bd4d80214e89bcaa36f6ed8e8c13e9e3bcc485a9966759a54"`,
  )

  const tx = await anvilMainnet.request({
    method: 'eth_getTransactionByHash',
    params: [hash],
  })

  expect(tx).toMatchInlineSnapshot(`
    {
      "blockHash": "0xde6b6b26f60a87f361b6688771196a79f6ac152cae6284142b2dfe363b78dbb4",
      "blockNumber": "0x12f2975",
      "chainId": "0x1",
      "from": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "gas": "0x5208",
      "gasPrice": "0x2540be400",
      "hash": "0x431d828c5cfb696bd4d80214e89bcaa36f6ed8e8c13e9e3bcc485a9966759a54",
      "input": "0x",
      "nonce": "0x297",
      "r": "0x221b7f859c35a3f54defb3c29ad2f456a08f4acd3cbddda988a49d8803457655",
      "s": "0x243e08c40d4f672d37712b579481bf4324464a72a5fcba033aebf474fb65382b",
      "to": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "transactionIndex": "0x0",
      "v": "0x26",
      "value": "0xde0b6b3a7640000",
    }
  `)
})
