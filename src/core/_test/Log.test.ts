import { AbiEvent, Hex, Log } from 'ox'
import { describe, expect, test } from 'vp/test'
import { anvilMainnet } from '../../../test/prool.js'

describe('fromRpc', () => {
  test('default', () => {
    const log = Log.fromRpc({
      address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
        '0x000000000000000000000000000000000000000000000000000000000000025b',
      ],
      data: '0x',
      blockHash:
        '0xabe69134e80a12f6a93d0aa18215b5b86c2fb338bae911790ca374a8716e01a4',
      blockNumber: '0x12d846c',
      blockTimestamp: '0x662f6fcf',
      transactionHash:
        '0xcfa52db0bc2cb5bdcb2c5bd8816df7a2f018a0e3964ab1ef4d794cf327966e93',
      transactionIndex: '0x91',
      logIndex: '0x10f',
      removed: false,
    })
    expect(log).toMatchInlineSnapshot(`
    {
      "address": "0xfba3912ca04dd458c843e2ee08967fc04f3579c2",
      "blockHash": "0xabe69134e80a12f6a93d0aa18215b5b86c2fb338bae911790ca374a8716e01a4",
      "blockNumber": 19760236n,
      "blockTimestamp": 1714384847n,
      "data": "0x",
      "logIndex": 271,
      "removed": false,
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
        "0x000000000000000000000000000000000000000000000000000000000000025b",
      ],
      "transactionHash": "0xcfa52db0bc2cb5bdcb2c5bd8816df7a2f018a0e3964ab1ef4d794cf327966e93",
      "transactionIndex": 145,
    }
  `)
  })

  test('behavior: nullish values', () => {
    const log = Log.fromRpc(
      {
        address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
          '0x000000000000000000000000000000000000000000000000000000000000025b',
        ],
        data: '0x',
        blockHash: null,
        blockNumber: null,
        blockTimestamp: null,
        transactionHash: null,
        transactionIndex: null,
        logIndex: null,
        removed: false,
      },
      { pending: true },
    )
    expect(log).toMatchInlineSnapshot(`
    {
      "address": "0xfba3912ca04dd458c843e2ee08967fc04f3579c2",
      "blockHash": null,
      "blockNumber": null,
      "blockTimestamp": null,
      "data": "0x",
      "logIndex": null,
      "removed": false,
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
        "0x000000000000000000000000000000000000000000000000000000000000025b",
      ],
      "transactionHash": null,
      "transactionIndex": null,
    }
  `)
  })

  test('behavior: network', async () => {
    const transfer = AbiEvent.from(
      'event Transfer(address indexed from, address indexed to, uint256 indexed value)',
    )

    const { topics } = AbiEvent.encode(transfer)

    const logs = await anvilMainnet.request({
      method: 'eth_getLogs',
      params: [
        {
          address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
          fromBlock: Hex.fromNumber(19760235n),
          toBlock: Hex.fromNumber(19760240n),
          topics,
        },
      ],
    })

    const log = Log.fromRpc(logs[0]!)
    expect(log).toMatchInlineSnapshot(`
      {
        "address": "0xfba3912ca04dd458c843e2ee08967fc04f3579c2",
        "blockHash": "0xabe69134e80a12f6a93d0aa18215b5b86c2fb338bae911790ca374a8716e01a4",
        "blockNumber": 19760236n,
        "blockTimestamp": 1714384847n,
        "data": "0x",
        "logIndex": 271,
        "removed": false,
        "topics": [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
          "0x000000000000000000000000000000000000000000000000000000000000025b",
        ],
        "transactionHash": "0xcfa52db0bc2cb5bdcb2c5bd8816df7a2f018a0e3964ab1ef4d794cf327966e93",
        "transactionIndex": 145,
      }
    `)
  })
})

describe('toRpc', () => {
  test('default', () => {
    const log = Log.toRpc({
      address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
      blockHash:
        '0xabe69134e80a12f6a93d0aa18215b5b86c2fb338bae911790ca374a8716e01a4',
      blockNumber: 19760236n,
      blockTimestamp: 1714384847n,
      data: '0x',
      logIndex: 271,
      removed: false,
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
        '0x000000000000000000000000000000000000000000000000000000000000025b',
      ],
      transactionHash:
        '0xcfa52db0bc2cb5bdcb2c5bd8816df7a2f018a0e3964ab1ef4d794cf327966e93',
      transactionIndex: 145,
    })
    expect(log).toMatchInlineSnapshot(`
      {
        "address": "0xfba3912ca04dd458c843e2ee08967fc04f3579c2",
        "blockHash": "0xabe69134e80a12f6a93d0aa18215b5b86c2fb338bae911790ca374a8716e01a4",
        "blockNumber": "0x12d846c",
        "blockTimestamp": "0x662f6fcf",
        "data": "0x",
        "logIndex": "0x10f",
        "removed": false,
        "topics": [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
          "0x0000000000000000000000000000000000000000000000000000000000000000",
          "0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
          "0x000000000000000000000000000000000000000000000000000000000000025b",
        ],
        "transactionHash": "0xcfa52db0bc2cb5bdcb2c5bd8816df7a2f018a0e3964ab1ef4d794cf327966e93",
        "transactionIndex": "0x91",
      }
    `)
  })

  test('numberish inputs', () => {
    const input = {
      address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
      blockHash:
        '0xabe69134e80a12f6a93d0aa18215b5b86c2fb338bae911790ca374a8716e01a4',
      data: '0x',
      removed: false,
      topics: [
        '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
        '0x000000000000000000000000000000000000000000000000000000000000025b',
      ],
      transactionHash:
        '0xcfa52db0bc2cb5bdcb2c5bd8816df7a2f018a0e3964ab1ef4d794cf327966e93',
    } satisfies Partial<Parameters<typeof Log.toRpc>[0]>
    const fromBigint = Log.toRpc({
      ...input,
      blockNumber: 19760236n,
      blockTimestamp: 1714384847n,
      logIndex: 271,
      transactionIndex: 145,
    })
    const fromNumber = Log.toRpc({
      ...input,
      blockNumber: 19760236,
      blockTimestamp: 1714384847,
      logIndex: 271,
      transactionIndex: 145,
    })
    const fromHex = Log.toRpc({
      ...input,
      blockNumber: '0x12d846c',
      blockTimestamp: '0x662f6fcf',
      logIndex: '0x10f',
      transactionIndex: '0x91',
    })

    expect(fromBigint).toEqual(fromNumber)
    expect(fromBigint).toEqual(fromHex)
  })

  test('behavior: nullish values', () => {
    const log = Log.toRpc(
      {
        address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
        blockHash: null,
        blockNumber: null,
        blockTimestamp: null,
        data: '0x',
        logIndex: null,
        removed: false,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1',
          '0x000000000000000000000000000000000000000000000000000000000000025b',
        ],
        transactionHash: null,
        transactionIndex: null,
      },
      { pending: true },
    )
    expect(log).toMatchInlineSnapshot(`
    {
      "address": "0xfba3912ca04dd458c843e2ee08967fc04f3579c2",
      "blockHash": null,
      "blockNumber": null,
      "blockTimestamp": null,
      "data": "0x",
      "logIndex": null,
      "removed": false,
      "topics": [
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000c04d9e9278ec5e4d424476d3ebec70cb5d648d1",
        "0x000000000000000000000000000000000000000000000000000000000000025b",
      ],
      "transactionHash": null,
      "transactionIndex": null,
    }
  `)
  })
})

test('exports', () => {
  expect(Object.keys(Log)).toMatchInlineSnapshot(`
    [
      "fromRpc",
      "toRpc",
    ]
  `)
})
