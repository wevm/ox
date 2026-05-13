import { bench, describe } from 'vitest'
import * as RpcTransport from './RpcTransport.js'

const jsonHeaders = new Headers({ 'Content-Type': 'application/json' })

const mockFetch = (async () => {
  return new Response(
    JSON.stringify({ id: 0, jsonrpc: '2.0', result: '0x1a2b3c' }),
    { status: 200, headers: jsonHeaders },
  )
}) as typeof fetch

describe('RpcTransport.fromHttp', () => {
  const transport = RpcTransport.fromHttp('https://example.com', {
    fetchFn: mockFetch,
  })

  bench('request(no params)', async () => {
    await transport.request({ method: 'eth_blockNumber' })
  })

  bench('request(with params)', async () => {
    await transport.request({
      method: 'eth_call',
      params: [
        {
          to: '0x0000000000000000000000000000000000000000',
          data: '0xdeadbeef',
        },
      ],
    } as never)
  })

  const rawTransport = RpcTransport.fromHttp('https://example.com', {
    fetchFn: mockFetch,
    raw: true,
  })

  bench('request(raw)', async () => {
    await rawTransport.request({ method: 'eth_blockNumber' })
  })
})
