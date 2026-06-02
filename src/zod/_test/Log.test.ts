import { describe, expect, test } from 'vp/test'
import * as z_Log from '../Log.js'
import * as z from 'zod/mini'

const address = '0x0000000000000000000000000000000000000000'
const blockHash = `0x${'11'.repeat(32)}` as const
const transactionHash = `0x${'22'.repeat(32)}` as const
const topic = `0x${'33'.repeat(32)}` as const

describe('Log', () => {
  test('decodes and encodes logs', () => {
    expect(
      z.decode(z_Log.Log, {
        address,
        blockHash,
        blockNumber: '0x12d846c',
        blockTimestamp: '0x1',
        data: '0xdeadbeef',
        logIndex: '0x10f',
        topics: [topic],
        transactionHash,
        transactionIndex: '0x91',
        removed: false,
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "blockHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "blockNumber": 19760236n,
        "blockTimestamp": 1n,
        "data": "0xdeadbeef",
        "logIndex": 271,
        "removed": false,
        "topics": [
          "0x3333333333333333333333333333333333333333333333333333333333333333",
        ],
        "transactionHash": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "transactionIndex": 145,
      }
    `)
    expect(
      z.encode(z_Log.Log, {
        address,
        blockHash,
        blockNumber: 19760236n,
        blockTimestamp: 1n,
        data: '0xdeadbeef',
        logIndex: 271,
        topics: [topic],
        transactionHash,
        transactionIndex: 145,
        removed: false,
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "blockHash": "0x1111111111111111111111111111111111111111111111111111111111111111",
        "blockNumber": "0x12d846c",
        "blockTimestamp": "0x1",
        "data": "0xdeadbeef",
        "logIndex": "0x10f",
        "removed": false,
        "topics": [
          "0x3333333333333333333333333333333333333333333333333333333333333333",
        ],
        "transactionHash": "0x2222222222222222222222222222222222222222222222222222222222222222",
        "transactionIndex": "0x91",
      }
    `)
  })

  test('decodes pending logs', () => {
    expect(
      z.decode(z_Log.Pending, {
        address,
        blockHash: null,
        blockNumber: null,
        blockTimestamp: null,
        data: '0xdeadbeef',
        logIndex: null,
        topics: [topic],
        transactionHash: null,
        transactionIndex: null,
        removed: false,
      }),
    ).toMatchInlineSnapshot(`
      {
        "address": "0x0000000000000000000000000000000000000000",
        "blockHash": null,
        "blockNumber": null,
        "blockTimestamp": null,
        "data": "0xdeadbeef",
        "logIndex": null,
        "removed": false,
        "topics": [
          "0x3333333333333333333333333333333333333333333333333333333333333333",
        ],
        "transactionHash": null,
        "transactionIndex": null,
      }
    `)
  })

  test('rejects invalid topics and quantities', () => {
    expect(
      z.safeDecode(z_Log.Log, {
        address,
        blockHash,
        blockNumber: '0x1',
        data: '0x',
        logIndex: '0x0',
        topics: ['0xz'],
        transactionHash,
        transactionIndex: '0x0',
        removed: false,
      }).success,
    ).toBe(false)
    expect(
      z.safeDecode(z_Log.Log, {
        address,
        blockHash,
        blockNumber: '0x',
        data: '0x',
        logIndex: '0x0',
        topics: [topic],
        transactionHash,
        transactionIndex: '0x0',
        removed: false,
      }).success,
    ).toBe(false)
  })
})
