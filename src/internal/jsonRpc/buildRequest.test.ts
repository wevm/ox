import { expect, test } from 'vitest'
import { JsonRpc } from 'ox'

test('default', () => {
  const request = JsonRpc.buildRequest({
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
})
