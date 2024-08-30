import { JsonRpc } from 'ox'
import { expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'

test('default', async () => {
  const store = JsonRpc.createRequestStore()

  expect(store.id).toBe(0)

  const requests = [
    store.prepare({
      method: 'eth_blockNumber',
    }),
    store.prepare({
      method: 'eth_call',
      params: [
        {
          to: '0x0000000000000000000000000000000000000000',
          data: '0xdeadbeef',
        },
      ],
    }),
    store.prepare({
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

  expect(store.id).toBe(3)

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

  const responses = await Promise.all(
    requests.map((request) =>
      fetch(anvilMainnet.rpcUrl, {
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }).then((res) => res.json()),
    ),
  )
  expect(responses).toMatchInlineSnapshot(`
    [
      {
        "id": 0,
        "jsonrpc": "2.0",
        "result": "0x12f2974",
      },
      {
        "id": 1,
        "jsonrpc": "2.0",
        "result": "0x",
      },
      {
        "id": 2,
        "jsonrpc": "2.0",
        "result": "0x5248",
      },
    ]
  `)
})

test('options: id', async () => {
  const store = JsonRpc.createRequestStore({ id: 10 })

  const requests = [
    store.prepare({
      method: 'eth_blockNumber',
    }),
    store.prepare({
      method: 'eth_blockNumber',
    }),
    store.prepare({
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

  const responses = await Promise.all(
    requests.map((request) =>
      fetch(anvilMainnet.rpcUrl, {
        body: JSON.stringify(request),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      }).then((res) => res.json()),
    ),
  )
  expect(responses).toMatchInlineSnapshot(`
    [
      {
        "id": 10,
        "jsonrpc": "2.0",
        "result": "0x12f2974",
      },
      {
        "id": 11,
        "jsonrpc": "2.0",
        "result": "0x12f2974",
      },
      {
        "id": 12,
        "jsonrpc": "2.0",
        "result": "0x12f2974",
      },
    ]
  `)
})
