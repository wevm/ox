import { describe, expect, test } from 'vitest'
import { create } from './rpcTransport.js'

describe('create', () => {
  test('default', async () => {
    const transport = create({
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

  test('behavior: raw', async () => {
    const transport = create(
      {
        request: async () => {
          return {
            id: 0,
            jsonrpc: '2.0',
            result: ['0x0000000000000000000000000000000000000000'],
          }
        },
      },
      { raw: true },
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
})
