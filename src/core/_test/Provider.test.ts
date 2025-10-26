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

  test('behavior: methods work without explicit binding', () => {
    const emitter = Provider.createEmitter()

    const provider = Provider.from({
      ...emitter,
      async request(args) {
        return args
      },
    })

    // Test that destructured methods still work correctly
    const { on, emit, off, once } = provider
    const calls: any = []

    // Methods should work when called independently
    on('accountsChanged', (accounts) => calls.push(['on', accounts]))
    once('chainChanged', (chainId) => calls.push(['once', chainId]))

    emit('accountsChanged', [address.vitalik])
    emit('accountsChanged', [address.usdcHolder])
    emit('chainChanged', '0x1')
    emit('chainChanged', '0x89') // Should not be captured by 'once'

    expect(calls).toMatchInlineSnapshot(`
    [
      [
        "on",
        [
          "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
        ],
      ],
      [
        "on",
        [
          "0x5414d89a8bf7e99d732bc52f3e6a3ef461c0c078",
        ],
      ],
      [
        "once",
        "0x1",
      ],
    ]
  `)

    // Clean up
    off('accountsChanged')
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

  test('behavior: SwitchChainError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.SwitchChainError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.SwitchChainError: An error occurred when attempting to switch chain.]',
    )
  })

  test('behavior: SwitchChainError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.SwitchChainError.code,
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
      '[Provider.SwitchChainError: foo]',
    )
  })

  test('behavior: UnsupportedNonOptionalCapabilityError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.UnsupportedNonOptionalCapabilityError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.UnsupportedNonOptionalCapabilityError: This Wallet does not support a capability that was not marked as optional.]',
    )
  })

  test('behavior: UnsupportedNonOptionalCapabilityError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.UnsupportedNonOptionalCapabilityError.code,
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
      '[Provider.UnsupportedNonOptionalCapabilityError: foo]',
    )
  })

  test('behavior: UnsupportedChainIdError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.UnsupportedChainIdError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.UnsupportedChainIdError: This Wallet does not support the requested chain ID.]',
    )
  })

  test('behavior: UnsupportedChainIdError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.UnsupportedChainIdError.code,
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
      '[Provider.UnsupportedChainIdError: foo]',
    )
  })

  test('behavior: DuplicateIdError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.DuplicateIdError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.DuplicateIdError: There is already a bundle submitted with this ID.]',
    )
  })

  test('behavior: DuplicateIdError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.DuplicateIdError.code,
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
      '[Provider.DuplicateIdError: foo]',
    )
  })

  test('behavior: UnknownBundleIdError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.UnknownBundleIdError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.UnknownBundleIdError: This bundle id is unknown / has not been submitted.]',
    )
  })

  test('behavior: UnknownBundleIdError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.UnknownBundleIdError.code,
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
      '[Provider.UnknownBundleIdError: foo]',
    )
  })

  test('behavior: BundleTooLargeError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.BundleTooLargeError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.BundleTooLargeError: The call bundle is too large for the Wallet to process.]',
    )
  })

  test('behavior: BundleTooLargeError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.BundleTooLargeError.code,
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
      '[Provider.BundleTooLargeError: foo]',
    )
  })

  test('behavior: AtomicReadyWalletRejectedUpgradeError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.AtomicReadyWalletRejectedUpgradeError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.AtomicReadyWalletRejectedUpgradeError: The Wallet can support atomicity after an upgrade, but the user rejected the upgrade.]',
    )
  })

  test('behavior: AtomicReadyWalletRejectedUpgradeError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.AtomicReadyWalletRejectedUpgradeError.code,
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
      '[Provider.AtomicReadyWalletRejectedUpgradeError: foo]',
    )
  })

  test('behavior: AtomicityNotSupportedError', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Provider.AtomicityNotSupportedError()
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[Provider.AtomicityNotSupportedError: The wallet does not support atomic execution but the request requires it.]',
    )
  })

  test('behavior: AtomicityNotSupportedError (raw)', async () => {
    const provider = Provider.from({
      async request(_) {
        return {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: Provider.AtomicityNotSupportedError.code,
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
      '[Provider.AtomicityNotSupportedError: foo]',
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
      '[RpcResponse.InternalError: foo]',
    )
  })

  test('behavior: InternalError (cause)', async () => {
    const provider = Provider.from({
      async request(_) {
        throw new Error('lol')
      },
    })

    await expect(() =>
      provider.request({
        method: 'eth_blockNumber',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      '[RpcResponse.InternalError: lol]',
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
      '[RpcResponse.InvalidParamsError: No Signer available]',
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
      "SwitchChainError",
      "UnsupportedNonOptionalCapabilityError",
      "UnsupportedChainIdError",
      "DuplicateIdError",
      "UnknownBundleIdError",
      "BundleTooLargeError",
      "AtomicReadyWalletRejectedUpgradeError",
      "AtomicityNotSupportedError",
      "createEmitter",
      "from",
      "parseError",
      "IsUndefinedError",
    ]
  `)
})
