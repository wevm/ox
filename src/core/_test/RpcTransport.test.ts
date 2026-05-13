import { setTimeout } from 'node:timers/promises'
import { RpcTransport } from 'ox'
import { describe, expect, test } from 'vitest'
import { createHttpServer } from '../../../test/http.js'
import { anvilMainnet } from '../../../test/prool.js'

describe('fromHttp', () => {
  test('default', async () => {
    const transport = RpcTransport.fromHttp(anvilMainnet.rpcUrl)

    const accounts = await transport.request({ method: 'eth_accounts' })

    expect(accounts).toMatchInlineSnapshot(`
    [
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
      "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
      "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
      "0x976ea74026e726554db657fa54763abd0c3a0aa9",
      "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
      "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
      "0xa0ee7a142d267c1f36714e4a8f75612f20a79720",
    ]
  `)
  })

  test('options: raw', async () => {
    const transport = RpcTransport.fromHttp(anvilMainnet.rpcUrl, { raw: true })

    const accounts = await transport.request({ method: 'eth_accounts' })

    expect(accounts).toMatchInlineSnapshot(`
    {
      "id": 0,
      "jsonrpc": "2.0",
      "result": [
        "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
        "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
        "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
        "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
        "0x976ea74026e726554db657fa54763abd0c3a0aa9",
        "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
        "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
        "0xa0ee7a142d267c1f36714e4a8f75612f20a79720",
      ],
    }
  `)
  })

  test('options: fetchOptions', async () => {
    const server = await createHttpServer((req, res) => {
      const header = req.headers['x-custom-header']
      res.end(JSON.stringify({ id: 0, jsonrpc: '2.0', result: header }))
    })

    const transport = RpcTransport.fromHttp(server.url, {
      fetchOptions: {
        headers: {
          'x-custom-header': 'wagmi',
        },
      },
    })

    const blockNumber = await transport.request({ method: 'eth_accounts' })

    expect(blockNumber).toMatchInlineSnapshot(`"wagmi"`)
  })

  test('options: fetchOptions (fn)', async () => {
    const server = await createHttpServer((req, res) => {
      const header = req.headers['x-custom-header']
      res.end(JSON.stringify({ id: 0, jsonrpc: '2.0', result: header }))
    })

    const transport = RpcTransport.fromHttp(server.url, {
      fetchOptions: ({ method }) => ({
        headers: {
          'x-custom-header': method,
        },
      }),
    })

    const blockNumber = await transport.request({ method: 'eth_accounts' })

    expect(blockNumber).toMatchInlineSnapshot(`"eth_accounts"`)
  })

  test('options: timeout', async () => {
    const server = await createHttpServer(async (_, res) => {
      await setTimeout(100)
      res.end(JSON.stringify({ result: 'wagmi' }))
    })

    const transport = RpcTransport.fromHttp(server.url, {
      timeout: 50,
    })

    await expect(() =>
      transport.request({ method: 'eth_accounts' }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Promise.TimeoutError: Operation timed out.]',
    )
  })

  test('options: signal', async () => {
    const server = await createHttpServer(async (_, res) => {
      await setTimeout(100)
      res.end(JSON.stringify({ result: 'wagmi' }))
    })

    const controller = new AbortController()
    const transport = RpcTransport.fromHttp(server.url, {
      fetchOptions: {
        signal: controller.signal,
      },
    })

    await Promise.all([
      controller.abort(),
      expect(() =>
        transport.request({ method: 'eth_accounts' }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        '[Promise.TimeoutError: Operation timed out.]',
      ),
    ])
  })

  test('behavior: no timeout', async () => {
    const transport = RpcTransport.fromHttp(anvilMainnet.rpcUrl, { timeout: 0 })

    const blockNumber = await transport.request({ method: 'eth_accounts' })

    expect(blockNumber).toMatchInlineSnapshot(`
    [
      "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
      "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
      "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
      "0x976ea74026e726554db657fa54763abd0c3a0aa9",
      "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
      "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
      "0xa0ee7a142d267c1f36714e4a8f75612f20a79720",
    ]
  `)
  })

  test('behavior: no res', async () => {
    const server = await createHttpServer((_, res) => {
      res.end()
    })

    const transport = RpcTransport.fromHttp(server.url)

    await expect(() =>
      transport.request({ method: 'eth_accounts' }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      [RpcTransport.MalformedResponseError: HTTP Response could not be parsed as JSON.

      Response: ]
    `)
  })

  test('behavior: http error', async () => {
    const server = await createHttpServer((_, res) => {
      res.statusCode = 400
      res.end()
    })

    const transport = RpcTransport.fromHttp(server.url)

    await expect(() =>
      transport.request({ method: 'eth_accounts' }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
    [RpcTransport.HttpError: HTTP request failed.

    Status: 400
    URL: https://oxlib.sh/rpc
    Body: "{\\"id\\":0,\\"method\\":\\"eth_accounts\\",\\"jsonrpc\\":\\"2.0\\"}"

    Details: Bad Request]
  `)
  })

  test('behavior: http error + response', async () => {
    const server = await createHttpServer((_, res) => {
      res.statusCode = 400
      res.end('bad')
    })

    const transport = RpcTransport.fromHttp(server.url)

    await expect(() =>
      transport.request({ method: 'eth_accounts' }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
    [RpcTransport.HttpError: HTTP request failed.

    Status: 400
    URL: https://oxlib.sh/rpc
    Body: "{\\"id\\":0,\\"method\\":\\"eth_accounts\\",\\"jsonrpc\\":\\"2.0\\"}"

    Details: bad]
  `)
  })

  test('behavior: malformed text response', async () => {
    const server = await createHttpServer((_, res) => {
      res.end('bad')
    })

    const transport = RpcTransport.fromHttp(server.url)

    await expect(() =>
      transport.request({ method: 'eth_accounts' }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
    [RpcTransport.MalformedResponseError: HTTP Response could not be parsed as JSON.

    Response: bad]
  `)
  })

  test('behavior: timeout still fires when caller supplies signal', async () => {
    // Regression: previously fetchOptions.signal would replace the timeout
    // signal, so the timeout could never abort the request.
    const server = await createHttpServer(async (_, res) => {
      await setTimeout(200)
      res.end(JSON.stringify({ id: 0, jsonrpc: '2.0', result: 'wagmi' }))
    })

    const controller = new AbortController()
    const transport = RpcTransport.fromHttp(server.url, {
      timeout: 50,
      fetchOptions: {
        signal: controller.signal,
      },
    })

    await expect(() =>
      transport.request({ method: 'eth_accounts' }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Promise.TimeoutError: Operation timed out.]',
    )

    server.close()
  })
})

describe('fromHttp: requestRaw', () => {
  test('default', async () => {
    const server = await createHttpServer((_, res) => {
      res.end(JSON.stringify({ id: 0, jsonrpc: '2.0', result: '0x1' }))
    })

    const transport = RpcTransport.fromHttp(server.url)

    const envelope = await transport.requestRaw({ method: 'eth_blockNumber' })

    expect(envelope).toMatchInlineSnapshot(`
      {
        "id": 0,
        "jsonrpc": "2.0",
        "result": "0x1",
      }
    `)
  })

  test('error envelope', async () => {
    const server = await createHttpServer((_, res) => {
      res.end(
        JSON.stringify({
          id: 0,
          jsonrpc: '2.0',
          error: { code: -32601, message: 'Method does not exist.' },
        }),
      )
    })

    const transport = RpcTransport.fromHttp(server.url)

    const envelope = await transport.requestRaw({ method: 'eth_blockNumber' })

    expect(envelope).toMatchInlineSnapshot(`
      {
        "error": {
          "code": -32601,
          "message": "Method does not exist.",
        },
        "id": 0,
        "jsonrpc": "2.0",
      }
    `)
  })
})

describe('fromHttp: batch', () => {
  test('default', async () => {
    const server = await createHttpServer((req, res) => {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })
      req.on('end', () => {
        const requests = JSON.parse(body) as Array<{
          id: number
          method: string
        }>
        const responses = requests.map((r) => ({
          id: r.id,
          jsonrpc: '2.0',
          result: r.method === 'eth_blockNumber' ? '0x1' : '0x2',
        }))
        res.end(JSON.stringify(responses))
      })
    })

    const transport = RpcTransport.fromHttp(server.url)

    const responses = await transport.batch([
      { method: 'eth_blockNumber' },
      { method: 'eth_chainId' },
    ])

    expect(responses).toMatchInlineSnapshot(`
      [
        {
          "id": 0,
          "jsonrpc": "2.0",
          "result": "0x1",
        },
        {
          "id": 1,
          "jsonrpc": "2.0",
          "result": "0x2",
        },
      ]
    `)
  })

  test('reorders responses by id', async () => {
    const server = await createHttpServer((req, res) => {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })
      req.on('end', () => {
        const requests = JSON.parse(body) as Array<{
          id: number
          method: string
        }>
        // Return responses in reverse order to verify re-ordering.
        const responses = requests
          .map((r) => ({
            id: r.id,
            jsonrpc: '2.0',
            result: r.method,
          }))
          .reverse()
        res.end(JSON.stringify(responses))
      })
    })

    const transport = RpcTransport.fromHttp(server.url)

    const responses = await transport.batch([
      { method: 'eth_blockNumber' },
      { method: 'eth_chainId' },
    ])

    expect(responses[0]?.result).toBe('eth_blockNumber')
    expect(responses[1]?.result).toBe('eth_chainId')
  })

  test('rejects empty input', async () => {
    const transport = RpcTransport.fromHttp('http://localhost:0')

    await expect(() =>
      transport.batch([]),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[RpcTransport.EmptyBatchError: A JSON-RPC batch must contain at least one request.]',
    )
  })

  test('throws on malformed response (not array)', async () => {
    const server = await createHttpServer((_, res) => {
      res.end(JSON.stringify({ id: 0, jsonrpc: '2.0', result: '0x1' }))
    })

    const transport = RpcTransport.fromHttp(server.url)

    await expect(() =>
      transport.batch([{ method: 'eth_blockNumber' }]),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      [RpcTransport.MalformedBatchResponseError: JSON-RPC batch response is malformed.

      Details: Expected an array of JSON-RPC responses.]
    `)
  })

  test('throws on missing response id', async () => {
    const server = await createHttpServer((_, res) => {
      res.end(JSON.stringify([{ id: 999, jsonrpc: '2.0', result: '0x1' }]))
    })

    const transport = RpcTransport.fromHttp(server.url)

    await expect(() =>
      transport.batch([{ method: 'eth_blockNumber' }]),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`
      [RpcTransport.MalformedBatchResponseError: JSON-RPC batch response is malformed.

      Details: Missing response for id 0.]
    `)
  })
})

describe('fromHttp: retry', () => {
  test('retries on 5xx and eventually succeeds', async () => {
    let attempts = 0
    const server = await createHttpServer((_, res) => {
      attempts++
      if (attempts < 3) {
        res.statusCode = 503
        res.end()
        return
      }
      res.end(JSON.stringify({ id: 0, jsonrpc: '2.0', result: '0xff' }))
    })

    const transport = RpcTransport.fromHttp(server.url, {
      retryCount: 5,
      retryDelay: 0,
    })

    const result = await transport.request({ method: 'eth_blockNumber' })
    expect(result).toBe('0xff')
    expect(attempts).toBe(3)
  })

  test('does not retry by default', async () => {
    let attempts = 0
    const server = await createHttpServer((_, res) => {
      attempts++
      res.statusCode = 503
      res.end()
    })

    const transport = RpcTransport.fromHttp(server.url)

    await expect(() =>
      transport.request({ method: 'eth_blockNumber' }),
    ).rejects.toThrow(RpcTransport.HttpError)
    expect(attempts).toBe(1)
  })

  test('default predicate skips wallet/state-changing methods', async () => {
    let attempts = 0
    const server = await createHttpServer((_, res) => {
      attempts++
      res.statusCode = 503
      res.end()
    })

    const transport = RpcTransport.fromHttp(server.url, {
      retryCount: 3,
      retryDelay: 0,
    })

    await expect(() =>
      transport.request({
        method: 'eth_sendTransaction',
        params: [{} as never],
      } as never),
    ).rejects.toThrow(RpcTransport.HttpError)
    expect(attempts).toBe(1)
  })

  test('custom shouldRetry overrides default', async () => {
    let attempts = 0
    const server = await createHttpServer((_, res) => {
      attempts++
      res.statusCode = 503
      res.end()
    })

    const transport = RpcTransport.fromHttp(server.url, {
      retryCount: 2,
      retryDelay: 0,
      shouldRetry: () => false,
    })

    await expect(() =>
      transport.request({ method: 'eth_blockNumber' }),
    ).rejects.toThrow(RpcTransport.HttpError)
    expect(attempts).toBe(1)
  })

  test('respects retryCount limit', async () => {
    let attempts = 0
    const server = await createHttpServer((_, res) => {
      attempts++
      res.statusCode = 503
      res.end()
    })

    const transport = RpcTransport.fromHttp(server.url, {
      retryCount: 2,
      retryDelay: 0,
    })

    await expect(() =>
      transport.request({ method: 'eth_blockNumber' }),
    ).rejects.toThrow(RpcTransport.HttpError)
    // 1 initial + 2 retries
    expect(attempts).toBe(3)
  })
})

test('exports', () => {
  expect(Object.keys(RpcTransport)).toMatchInlineSnapshot(`
    [
      "fromHttp",
      "HttpError",
      "MalformedResponseError",
      "EmptyBatchError",
      "MalformedBatchResponseError",
    ]
  `)
})
