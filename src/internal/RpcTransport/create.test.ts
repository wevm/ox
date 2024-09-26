import { expect, test } from 'vitest'
import { RpcTransport_create } from './create.js'

test('default', async () => {
  const transport = RpcTransport_create({
    request: async () => {
      return {
        id: 0,
        jsonrpc: '2.0',
        result: ['0x0000000000000000000000000000000000000000'],
      }
    },
  })
  const accounts = await transport.request({ method: 'eth_accounts' })
  expect(accounts).toMatchInlineSnapshot(`
    [
      "0x0000000000000000000000000000000000000000",
    ]
  `)
})

test('behavior: safe', async () => {
  const transport = RpcTransport_create(
    {
      request: async () => {
        return {
          id: 0,
          jsonrpc: '2.0',
          result: ['0x0000000000000000000000000000000000000000'],
        }
      },
    },
    { safe: true },
  )
  const accounts = await transport.request({ method: 'eth_accounts' })
  expect(accounts).toMatchInlineSnapshot(`
    {
      "id": 0,
      "jsonrpc": "2.0",
      "result": [
        "0x0000000000000000000000000000000000000000",
      ],
    }
  `)
})
