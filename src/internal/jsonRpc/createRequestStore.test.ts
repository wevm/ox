import { JsonRpc } from 'ox'
import { expect, test } from 'vitest'

test('default', () => {
  const store = JsonRpc.createRequestStore()

  const requests = [
    store.buildRequest({
      method: 'eth_blockNumber',
    }),
    store.buildRequest({
      method: 'eth_call',
      params: [
        {
          to: '0x0000000000000000000000000000000000000000',
          data: '0xdeadbeef',
        },
      ],
    }),
    store.buildRequest({
      method: 'eth_estimateGas',
      params: [
        {
          from: '0x0000000000000000000000000000000000000000',
          to: '0x0000000000000000000000000000000000000000',
          data: '0xdeadbeef',
        },
      ],
    }),
  ]

  expect(requests).toMatchInlineSnapshot(`
    [
      {
        "id": 0,
        "jsonrpc": "2.0",
        "method": "eth_blockNumber",
      },
      {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [
          {
            "data": "0xdeadbeef",
            "to": "0x0000000000000000000000000000000000000000",
          },
        ],
      },
      {
        "id": 2,
        "jsonrpc": "2.0",
        "method": "eth_estimateGas",
        "params": [
          {
            "data": "0xdeadbeef",
            "from": "0x0000000000000000000000000000000000000000",
            "to": "0x0000000000000000000000000000000000000000",
          },
        ],
      },
    ]
  `)
})

test('options: id', () => {
  const store = JsonRpc.createRequestStore({ id: 10 })

  const requests = [
    store.buildRequest({
      method: 'eth_blockNumber',
    }),
    store.buildRequest({
      method: 'eth_blockNumber',
    }),
    store.buildRequest({
      method: 'eth_blockNumber',
    }),
  ]

  expect(requests).toMatchInlineSnapshot(`
    [
      {
        "id": 10,
        "jsonrpc": "2.0",
        "method": "eth_blockNumber",
      },
      {
        "id": 11,
        "jsonrpc": "2.0",
        "method": "eth_blockNumber",
      },
      {
        "id": 12,
        "jsonrpc": "2.0",
        "method": "eth_blockNumber",
      },
    ]
  `)
})
