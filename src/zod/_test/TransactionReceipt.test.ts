import { describe, expect, test } from 'vp/test'
import * as z_TransactionReceipt from '../TransactionReceipt.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'
const blockHash = `0x${'11'.repeat(32)}` as const
const transactionHash = `0x${'22'.repeat(32)}` as const
const topic = `0x${'33'.repeat(32)}` as const
const logsBloom = '0x'

describe('TransactionReceipt', () => {
  test('decodes and encodes transaction receipts', () => {
    expect(
      z.decode(z_TransactionReceipt.TransactionReceipt, {
        blobGasPrice: '0x42069',
        blobGasUsed: '0x1337',
        blockHash,
        blockNumber: '0x12f296f',
        contractAddress: null,
        cumulativeGasUsed: '0x82515',
        effectiveGasPrice: '0x21c2f6c09',
        from: address,
        gasUsed: '0x2abba',
        logs: [
          {
            address,
            blockHash,
            blockNumber: '0x12f296f',
            data: '0xdeadbeef',
            logIndex: '0x11',
            topics: [topic],
            transactionHash,
            transactionIndex: '0x2',
            removed: false,
          },
        ],
        logsBloom,
        root: '0x',
        status: '0x1',
        to: address,
        transactionHash,
        transactionIndex: '0x2',
        type: '0x2',
      }),
    ).toMatchInlineSnapshot(`
      {
        "blobGasPrice": 270441n,
        "blobGasUsed": 4919n,
        "blockHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "blockNumber": 19868015n,
        "contractAddress": null,
        "cumulativeGasUsed": 533781n,
        "effectiveGasPrice": 9062804489n,
        "from": "0x0000000000000000000000000000000000000000",
        "gasUsed": 175034n,
        "logs": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "blockHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
            "blockNumber": 19868015n,
            "data": "0xdeadbeef",
            "logIndex": 17,
            "removed": false,
            "topics": [
              "0x3333333333333333333333333333333333333333333333333333333333333333",
            ],
            "transactionHash": "0x2222222222222222222222222222222222222222222222222222222222222222",
            "transactionIndex": 2,
          },
        ],
        "logsBloom": "0x",
        "root": "0x",
        "status": "success",
        "to": "0x0000000000000000000000000000000000000000",
        "transactionHash": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "transactionIndex": 2,
        "type": "eip1559",
      }
    `)
    expect(
      z.encode(z_TransactionReceipt.TransactionReceipt, {
        blobGasPrice: 270441n,
        blobGasUsed: 4919n,
        blockHash,
        blockNumber: 19868015n,
        contractAddress: null,
        cumulativeGasUsed: 533781n,
        effectiveGasPrice: 9062804489n,
        from: address,
        gasUsed: 175034n,
        logs: [
          {
            address,
            blockHash,
            blockNumber: 19868015n,
            data: '0xdeadbeef',
            logIndex: 17,
            topics: [topic],
            transactionHash,
            transactionIndex: 2,
            removed: false,
          },
        ],
        logsBloom,
        root: '0x',
        status: 'success',
        to: address,
        transactionHash,
        transactionIndex: 2,
        type: 'eip1559',
      }),
    ).toMatchInlineSnapshot(`
      {
        "blobGasPrice": "0x42069",
        "blobGasUsed": "0x1337",
        "blockHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "blockNumber": "0x12f296f",
        "contractAddress": null,
        "cumulativeGasUsed": "0x82515",
        "effectiveGasPrice": "0x21c2f6c09",
        "from": "0x0000000000000000000000000000000000000000",
        "gasUsed": "0x2abba",
        "logs": [
          {
            "address": "0x0000000000000000000000000000000000000000",
            "blockHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
            "blockNumber": "0x12f296f",
            "data": "0xdeadbeef",
            "logIndex": "0x11",
            "removed": false,
            "topics": [
              "0x3333333333333333333333333333333333333333333333333333333333333333",
            ],
            "transactionHash": "0x2222222222222222222222222222222222222222222222222222222222222222",
            "transactionIndex": "0x2",
          },
        ],
        "logsBloom": "0x",
        "root": "0x",
        "status": "0x1",
        "to": "0x0000000000000000000000000000000000000000",
        "transactionHash": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "transactionIndex": "0x2",
        "type": "0x2",
      }
    `)
  })

  test('preserves unknown transaction types', () => {
    expect(z.decode(z_TransactionReceipt.Type, '0x99')).toBe('0x99')
    expect(z.encode(z_TransactionReceipt.Type, 'custom')).toBe('custom')
  })

  test('rejects invalid statuses and nested logs', () => {
    const invalidStatus: unknown = '0x2'
    const invalidReceiptStatus: unknown = {
      blockHash,
      blockNumber: '0x1',
      cumulativeGasUsed: '0x1',
      effectiveGasPrice: '0x1',
      from: address,
      gasUsed: '0x1',
      logs: [],
      logsBloom,
      status: '0x2',
      to: address,
      transactionHash,
      transactionIndex: '0x0',
      type: '0x2',
    }
    const invalidReceiptLog: unknown = {
      blockHash,
      blockNumber: '0x1',
      cumulativeGasUsed: '0x1',
      effectiveGasPrice: '0x1',
      from: address,
      gasUsed: '0x1',
      logs: [
        {
          address,
          blockHash,
          blockNumber: '0x1',
          data: '0x',
          logIndex: '0x0',
          topics: [],
          transactionHash,
          transactionIndex: '0x0',
          removed: false,
        },
      ],
      logsBloom,
      status: '0x1',
      to: address,
      transactionHash,
      transactionIndex: '0x0',
      type: '0x2',
    }

    expect(
      z.safeDecode(z_TransactionReceipt.Status, invalidStatus as never).success,
    ).toBe(false)
    expect(
      z.safeDecode(
        z_TransactionReceipt.TransactionReceipt,
        invalidReceiptStatus as never,
      ).success,
    ).toBe(false)
    expect(
      z.safeDecode(
        z_TransactionReceipt.TransactionReceipt,
        invalidReceiptLog as never,
      ).success,
    ).toBe(false)
  })
})
