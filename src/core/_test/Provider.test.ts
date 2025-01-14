import { Provider, RpcRequest, RpcResponse } from 'ox'
import { describe, expect, test } from 'vitest'
import { anvilMainnet } from '../../../test/anvil.js'
import { address } from '../../../test/constants/addresses.js'

describe('Provider.createEmitter', () => {
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

describe('Provider.from', () => {
  test('default', async () => {
    const store = RpcRequest.createStore()

    const provider = Provider.from({
      async request(args) {
        return await fetch(anvilMainnet.rpcUrl, {
          body: JSON.stringify(store.prepare(args as never)),
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
          body: JSON.stringify(store.prepare(args as never)),
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
          body: JSON.stringify(store.prepare(args as never)),
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

  test('behavior: UnauthorizedError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.UnauthorizedError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.UnauthorizedError: The requested method and/or account has not been authorized by the user.]',
    )
  })

  test('behavior: UnauthorizedError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.UnauthorizedError.code,
            message: 'foo',
          },
        }
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.UnauthorizedError: foo]',
    )
  })

  test('behavior: UserRejectedRequestError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.UserRejectedRequestError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.UserRejectedRequestError: The user rejected the request.]',
    )
  })

  test('behavior: UserRejectedRequestError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.UserRejectedRequestError.code,
            message: 'foo',
          },
        }
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.UserRejectedRequestError: foo]',
    )
  })

  test('behavior: UnsupportedMethodError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.UnsupportedMethodError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.UnsupportedMethodError: The provider does not support the requested method.]',
    )
  })

  test('behavior: UnsupportedMethodError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.UnsupportedMethodError.code,
            message: 'foo',
          },
        }
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.UnsupportedMethodError: foo]',
    )
  })

  test('behavior: DisconnectedError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.DisconnectedError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.DisconnectedError: The provider is disconnected from all chains.]',
    )
  })

  test('behavior: DisconnectedError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.DisconnectedError.code,
            message: 'foo',
          },
        }
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.DisconnectedError: foo]',
    )
  })

  test('behavior: ChainDisconnectedError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.ChainDisconnectedError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.ChainDisconnectedError: The provider is not connected to the requested chain.]',
    )
  })

  test('behavior: ChainDisconnectedError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.ChainDisconnectedError.code,
            message: 'foo',
          },
        }
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.ChainDisconnectedError: foo]',
    )
  })

  test('behavior: BaseError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Error('foo')
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.InternalError: foo]',
    )
  })

  test('behavior: InternalError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new RpcResponse.InternalError({
          message: 'foo',
        })
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.InternalError: Internal JSON-RPC error.]',
    )
  })

  test('behavior: BaseError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: 1000,
            message: 'foo',
          },
        }
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.InternalError: foo]',
    )
  })

  test('behavior: network rpc error', async () => {
    const store = RpcRequest.createStore()

    const provider = Provider.from({
      async request(args) {
        return await fetch(anvilMainnet.rpcUrl, {
          body: JSON.stringify(store.prepare(args as never)),
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then((res) => res.json())
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
            to: '0x0000000000000000000000000000000000000000',
          },
        ],
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.InvalidParamsError: Invalid method parameters.]',
    )
  })

  test('error: undefined', () => {
    expect(() => Provider.from(undefined)).toThrowErrorMatchingInlineSnapshot(
      '[Provider.IsUndefinedError: `provider` is undefined.]',
    )
  })
})

test('Provider.InvalidMessageFieldError', () => {
  expect(new Provider.UserRejectedRequestError()).toMatchInlineSnapshot(
    '[Provider.UserRejectedRequestError: The user rejected the request.]',
  )
  expect(
    new Provider.UserRejectedRequestError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[Provider.UserRejectedRequestError: foo]')
  expect(
    JSON.stringify(new Provider.UserRejectedRequestError()),
  ).toMatchInlineSnapshot(
    `"{"name":"Provider.UserRejectedRequestError","code":4001,"details":"The user rejected the request."}"`,
  )
})

test('Provider.UnauthorizedError', () => {
  expect(new Provider.UnauthorizedError()).toMatchInlineSnapshot(
    '[Provider.UnauthorizedError: The requested method and/or account has not been authorized by the user.]',
  )
  expect(
    new Provider.UnauthorizedError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[Provider.UnauthorizedError: foo]')
  expect(
    JSON.stringify(new Provider.UnauthorizedError()),
  ).toMatchInlineSnapshot(
    `"{"name":"Provider.UnauthorizedError","code":4100,"details":"The requested method and/or account has not been authorized by the user."}"`,
  )
})

test('Provider.UnsupportedMethodError', () => {
  expect(new Provider.UnsupportedMethodError()).toMatchInlineSnapshot(
    '[Provider.UnsupportedMethodError: The provider does not support the requested method.]',
  )
  expect(
    new Provider.UnsupportedMethodError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[Provider.UnsupportedMethodError: foo]')
  expect(
    JSON.stringify(new Provider.UnsupportedMethodError()),
  ).toMatchInlineSnapshot(
    `"{"name":"Provider.UnsupportedMethodError","code":4200,"details":"The provider does not support the requested method."}"`,
  )
})

test('Provider.DisconnectedError', () => {
  expect(new Provider.DisconnectedError()).toMatchInlineSnapshot(
    '[Provider.DisconnectedError: The provider is disconnected from all chains.]',
  )
  expect(
    new Provider.DisconnectedError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[Provider.DisconnectedError: foo]')
  expect(
    JSON.stringify(new Provider.DisconnectedError()),
  ).toMatchInlineSnapshot(
    `"{"name":"Provider.DisconnectedError","code":4900,"details":"The provider is disconnected from all chains."}"`,
  )
})

test('Provider.ChainDisconnectedError', () => {
  expect(new Provider.ChainDisconnectedError()).toMatchInlineSnapshot(
    '[Provider.ChainDisconnectedError: The provider is not connected to the requested chain.]',
  )
  expect(
    new Provider.ChainDisconnectedError({ message: 'foo' }),
  ).toMatchInlineSnapshot('[Provider.ChainDisconnectedError: foo]')
  expect(
    JSON.stringify(new Provider.ChainDisconnectedError()),
  ).toMatchInlineSnapshot(
    `"{"name":"Provider.ChainDisconnectedError","code":4901,"details":"The provider is not connected to the requested chain."}"`,
  )
})

test('exports', () => {
  expect(Object.keys(Provider)).toMatchInlineSnapshot(`
    [
      "ProviderRpcError",
      "UserRejectedRequestError",
      "UnauthorizedError",
      "UnsupportedMethodError",
      "DisconnectedError",
      "ChainDisconnectedError",
      "createEmitter",
      "from",
      "parseErrorObject",
      "IsUndefinedError",
    ]
  `)
})
