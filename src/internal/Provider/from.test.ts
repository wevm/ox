import { Provider, RpcRequest, RpcResponse } from 'ox'
import { expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'

test('default', async () => {
  const store = RpcRequest.createStore()

  const provider = Provider.from({
    async request(args) {
      return await fetch(anvilMainnet.rpcUrl, {
        body: JSON.stringify(store.prepare(args)),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
        .then((res) => res.json())
        .then(RpcResponse.parse)
    },
  })

  const blockNumber = await provider.request({ method: 'eth_blockNumber' })

  expect(blockNumber).toMatchInlineSnapshot(`"0x12f2974"`)
})

test('error: undefined', () => {
  expect(() => Provider.from(undefined)).toThrowErrorMatchingInlineSnapshot(
    `
    [Provider.IsUndefinedError: \`provider\` is undefined.

    See: https://oxlib.sh/errors#providerisundefinederror]
  `,
  )
})
