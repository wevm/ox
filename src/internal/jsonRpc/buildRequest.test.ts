import { JsonRpc } from 'ox'
import { expect, test } from 'vitest'

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
