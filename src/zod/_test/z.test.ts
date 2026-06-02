import { z } from 'ox/zod'
import { expect, test } from 'vp/test'

const address = '0x0000000000000000000000000000000000000000'
const storageKey = `0x${'11'.repeat(32)}` as const

test('exports zod mini utilities, modules, and integer schemas', () => {
  expect(
    z.decode(z.AccountProof.AccountProof, {
      address,
      balance: '0x1',
      codeHash: storageKey,
      nonce: '0x2',
      storageHash: storageKey,
      accountProof: [],
      storageProof: [{ key: storageKey, proof: [], value: '0x3' }],
    }),
  ).toMatchObject({ balance: 1n, nonce: 2, storageProof: [{ value: 3n }] })
  expect(z.decode(z.Hex.Hex, '0xdeadbeef')).toBe('0xdeadbeef')
  expect(z.decode(z.Hex.Hex32, storageKey)).toBe(storageKey)
  expect(z.decode(z.BigInt, '0x2a')).toBe(42n)
  expect(z.decode(z.Number, '0x2a')).toBe(42)
  expect(z.decode(z.Uint256, '0x2a')).toBe(42n)
  expect(z.decode(z.Int8, '0xff')).toBe(-1)
  expect(
    z.decode(z.Authorization.Signed, {
      address,
      chainId: '0x1',
      nonce: '0x2',
      r: storageKey,
      s: storageKey,
      yParity: '0x1',
    }),
  ).toMatchObject({ chainId: 1, nonce: 2n, yParity: 1 })
  expect(
    z.decode(z.BlockOverrides.BlockOverrides, { baseFeePerGas: '0x1' }),
  ).toMatchObject({ baseFeePerGas: 1n })
  expect(
    z.decode(z.StateOverrides.StateOverrides, {
      [address]: { balance: '0x1' },
    }),
  ).toMatchObject({ [address]: { balance: 1n } })
  expect(
    z.decode(z.Log.Log, {
      address,
      blockHash: storageKey,
      blockNumber: '0x1',
      data: '0x',
      logIndex: '0x0',
      topics: [storageKey],
      transactionHash: storageKey,
      transactionIndex: '0x0',
      removed: false,
    }),
  ).toMatchObject({ blockNumber: 1n })
  expect(
    z.decode(z.RpcResponse.RpcResponse, {
      id: 0,
      jsonrpc: '2.0',
      result: '0x1',
    }),
  ).toMatchObject({ id: 0, result: '0x1' })
  expect(
    z.decode(z.AccessList.Item, {
      address,
      storageKeys: [storageKey],
    }),
  ).toMatchInlineSnapshot(`
    {
      "address": "0x0000000000000000000000000000000000000000",
      "storageKeys": [
        "0x1111111111111111111111111111111111111111111111111111111111111111",
      ],
    }
  `)
  expect(
    z.decode(z.TransactionRequest.TransactionRequest, {
      to: address,
      type: '0x2',
      value: '0x1',
    }),
  ).toMatchInlineSnapshot(`
    {
      "to": "0x0000000000000000000000000000000000000000",
      "type": "eip1559",
      "value": 1n,
    }
  `)
  expect(
    z.decode(z.TransactionReceipt.TransactionReceipt, {
      blockHash: storageKey,
      blockNumber: '0x1',
      cumulativeGasUsed: '0x2',
      effectiveGasPrice: '0x3',
      from: address,
      gasUsed: '0x4',
      logs: [],
      logsBloom: '0x',
      status: '0x1',
      to: address,
      transactionHash: storageKey,
      transactionIndex: '0x0',
      type: '0x2',
    }),
  ).toMatchInlineSnapshot(`
    {
      "blockHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
      "blockNumber": 1n,
      "cumulativeGasUsed": 2n,
      "effectiveGasPrice": 3n,
      "from": "0x0000000000000000000000000000000000000000",
      "gasUsed": 4n,
      "logs": [],
      "logsBloom": "0x",
      "status": "success",
      "to": "0x0000000000000000000000000000000000000000",
      "transactionHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
      "transactionIndex": 0,
      "type": "eip1559",
    }
  `)
  expect(
    z.decode(z.Filter.Filter, {
      fromBlock: '0x1',
      toBlock: 'latest',
      topics: [storageKey],
    }),
  ).toMatchInlineSnapshot(`
    {
      "fromBlock": 1n,
      "toBlock": "latest",
      "topics": [
        "0x1111111111111111111111111111111111111111111111111111111111111111",
      ],
    }
  `)
  expect(
    z.decode(z.Transaction.Eip1559, {
      accessList: [],
      blockHash: storageKey,
      blockNumber: '0x1',
      chainId: '0x1',
      from: address,
      gas: '0x5208',
      hash: storageKey,
      input: '0x',
      maxFeePerGas: '0x2',
      maxPriorityFeePerGas: '0x1',
      nonce: '0x0',
      r: storageKey,
      s: storageKey,
      to: address,
      transactionIndex: '0x0',
      type: '0x2',
      value: '0x0',
      yParity: '0x1',
    }),
  ).toMatchObject({ type: 'eip1559', gas: 21000n })
  expect(
    z.decode(z.Block.Block, {
      extraData: '0x',
      gasLimit: '0x1',
      gasUsed: '0x2',
      hash: storageKey,
      logsBloom: '0x',
      miner: address,
      mixHash: storageKey,
      nonce: '0x0000000000000000',
      number: '0x3',
      parentHash: storageKey,
      receiptsRoot: storageKey,
      sha3Uncles: storageKey,
      size: '0x4',
      stateRoot: storageKey,
      timestamp: '0x5',
      transactions: [],
      transactionsRoot: storageKey,
      uncles: [],
    }),
  ).toMatchObject({ gasLimit: 1n, number: 3n })
  expect(
    z.decode(z.TxEnvelopeEip1559.TxEnvelopeEip1559, {
      chainId: '0x1',
      maxFeePerGas: '0x2',
      type: '0x2',
    }),
  ).toMatchObject({ chainId: 1, maxFeePerGas: 2n, type: 'eip1559' })
  expect(
    z.decode(z.TransactionEnvelope.TransactionEnvelope, {
      chainId: '0x1',
      maxFeePerGas: '0x2',
      type: '0x2',
    }),
  ).toMatchObject({ chainId: 1, type: 'eip1559' })
})
