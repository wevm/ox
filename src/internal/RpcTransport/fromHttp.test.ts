import { setTimeout } from 'node:timers/promises'
import { RpcTransport } from 'ox'
import { expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'
import { createHttpServer } from '../../../test/http.js'

test('default', async () => {
  const transport = RpcTransport.fromHttp(anvilMainnet.rpcUrl)

  const blockNumber = await transport.request({ method: 'eth_accounts' })

  expect(blockNumber).toMatchInlineSnapshot(`
    [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
      "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
      "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
      "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
      "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
    ]
  `)
})

test('options: safe', async () => {
  const transport = RpcTransport.fromHttp(anvilMainnet.rpcUrl, { safe: true })

  const blockNumber = await transport.request({ method: 'eth_accounts' })

  expect(blockNumber).toMatchInlineSnapshot(`
    {
      "id": 0,
      "jsonrpc": "2.0",
      "result": [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
        "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
        "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
        "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
        "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
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
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
      "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
      "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
      "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
      "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
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
