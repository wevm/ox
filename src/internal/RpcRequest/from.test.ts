import { RpcRequest, RpcResponse } from 'ox'
import { expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'

test('default', async () => {
  const request = RpcRequest.from({
    method: 'eth_blockNumber',
    id: 0,
  })
  expect(request).toMatchInlineSnapshot(`
    {
      "id": 0,
      "jsonrpc": "2.0",
      "method": "eth_blockNumber",
    }
  `)

  const response = await fetch(anvilMainnet.rpcUrl, {
    body: JSON.stringify(request),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
    .then((res) => res.json())
    .then((res) => RpcResponse.parse(res, { request }))
  expect(response).toMatchInlineSnapshot(`
    {
      "id": 0,
      "jsonrpc": "2.0",
      "result": "0x12f2974",
    }
  `)
})
