import { Provider, RpcRequest, RpcResponse } from 'ox'
import { describe, expect, test } from 'vitest'
import { anvilMainnet } from '../test/anvil.js'
import { address } from '../test/constants/addresses.js'

describe('createEmitter', () => {
  test('default', () => {
    const emitter = Provider.createEmitter()

    expect(emitter).toMatchInlineSnapshot(`
    {
      "addListener": [Function],
      "emit": [Function],
      "eventNames": [Function],
      "listenerCount": [Function],
      "listeners": [Function],
      "off": [Function],
      "on": [Function],
      "once": [Function],
      "removeAllListeners": [Function],
      "removeListener": [Function],
    }
  `)
  })
})

describe('from', () => {
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
        }).then((res) => res.json())
      },
    })

    const blockNumber = await provider.request({
      method: 'eth_blockNumber',
    })

    expect(blockNumber).toMatchInlineSnapshot(`"0x12f2974"`)
  })

  test('behavior: pre-parsed', async () => {
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

  test('behavior: events', async () => {
    const emitter = Provider.createEmitter()
    const store = RpcRequest.createStore()

    const provider = Provider.from({
      ...emitter,
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

    const calls: any = []

    provider.on('accountsChanged', (accounts) => calls.push(accounts))

    emitter.emit('accountsChanged', [address.vitalik])
    emitter.emit('accountsChanged', [address.usdcHolder])

    expect(calls).toMatchInlineSnapshot(`
    [
      [
        "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      ],
      [
        "0x5414d89a8bf7e99d732bc52f3e6a3ef461c0c078",
      ],
    ]
  `)
  })

  test('error: undefined', () => {
    expect(() => Provider.from(undefined)).toThrowErrorMatchingInlineSnapshot(
      '[Provider.IsUndefinedError: `provider` is undefined.]',
    )
  })
})

test('exports', () => {
  expect(Object.keys(Provider)).toMatchInlineSnapshot(`
    [
      "ProviderRpcError",
      "createEmitter",
      "from",
      "IsUndefinedError",
    ]
  `)
})
