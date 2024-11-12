import { AbiEvent, Hex, Log } from 'ox'
import { describe, expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'

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

  test('behavior: nullish values', () => {
    const log = Log.toRpc(
      {
        address: '0xfba3912ca04dd458c843e2ee08967fc04f3579c2',
        blockHash: null,
        blockNumber: null,
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
