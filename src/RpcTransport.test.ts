import { setTimeout } from 'node:timers/promises'
import { RpcTransport } from 'ox'
import { describe, expect, test } from 'vitest'

import { anvilMainnet } from '../test/anvil.js'
import { createHttpServer } from '../test/http.js'

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
      res.end(JSON.stringify({ result: header }))
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
      res.end(JSON.stringify({ result: header }))
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

    const blockNumber = await transport.request({ method: 'eth_accounts' })

    expect(blockNumber).toMatchInlineSnapshot('undefined')
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

    Details: "bad"]
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
})

test('exports', () => {
  expect(Object.keys(RpcTransport)).toMatchInlineSnapshot(`
    [
      "fromHttp",
      "HttpError",
      "MalformedResponseError",
    ]
  `)
})
