import { Provider, RpcSchema } from 'ox'
import { describe, expectTypeOf, test } from 'vitest'

describe('Provider.createEmitter', () => {
  test('default', () => {
    const emitter = Provider.createEmitter()

    expectTypeOf(emitter.on).toBeFunction()
    expectTypeOf(emitter.emit).toBeFunction()
    expectTypeOf(emitter.off).toBeFunction()
    expectTypeOf(emitter.once).toBeFunction()

    // Validate default EIP-1193 event names exist and are typed correctly
    emitter.on('accountsChanged', (accounts) => {
      expectTypeOf(accounts).toEqualTypeOf<readonly `0x${string}`[]>()
    })
    emitter.on('chainChanged', (chainId) => {
      expectTypeOf(chainId).toEqualTypeOf<string>()
    })
    emitter.on('connect', (connectInfo) => {
      expectTypeOf(connectInfo).toMatchTypeOf<{ chainId: string }>()
    })
    emitter.on('disconnect', (error) => {
      expectTypeOf(error).toMatchTypeOf<Provider.ProviderRpcError>()
    })
    emitter.on('message', (message) => {
      expectTypeOf(message).toMatchTypeOf<{ type: string; data: unknown }>()
    })
  })

  test('with custom event map', () => {
    const emitter = Provider.createEmitter<{
      custom: (data: string) => void
    }>()
    expectTypeOf(emitter.on).toBeFunction()
    expectTypeOf(emitter.emit).toBeFunction()

    // Validate custom event exists and is typed correctly
    emitter.on('custom', (data) => {
      expectTypeOf(data).toEqualTypeOf<string>()
    })
    emitter.emit('custom', 'test')
  })

  test('with overridden default events', () => {
    const emitter = Provider.createEmitter<{
      accountsChanged: (data: { accounts: string[]; timestamp: number }) => void
      chainChanged: (data: number) => void
    }>()

    // Validate overridden events use custom types
    emitter.on('accountsChanged', (data) => {
      expectTypeOf(data).toEqualTypeOf<{
        accounts: string[]
        timestamp: number
      }>()
    })
    emitter.on('chainChanged', (data) => {
      expectTypeOf(data).toEqualTypeOf<number>()
    })

    // Default events that weren't overridden should still work
    emitter.on('connect', (connectInfo) => {
      expectTypeOf(connectInfo).toMatchTypeOf<{ chainId: string }>()
    })

    emitter.emit('accountsChanged', { accounts: ['0x...'], timestamp: 123 })
    emitter.emit('chainChanged', 1)
  })
})

describe('Provider.from', () => {
  test('default provider', () => {
    const provider = Provider.from({
      request: async (args) => args,
    })
    expectTypeOf(provider.request).toBeFunction()

    // Validate default RPC methods exist and return correct types
    expectTypeOf(
      provider.request({ method: 'eth_blockNumber' }),
    ).resolves.toEqualTypeOf<`0x${string}`>()

    expectTypeOf(
      provider.request({
        method: 'eth_getBalance',
        params: ['0x...', 'latest'],
      }),
    ).resolves.toEqualTypeOf<`0x${string}`>()

    expectTypeOf(
      provider.request({ method: 'eth_chainId' }),
    ).resolves.toEqualTypeOf<`0x${string}`>()

    expectTypeOf(
      provider.request({ method: 'eth_accounts' }),
    ).resolves.toEqualTypeOf<readonly `0x${string}`[]>()
  })

  test('with custom schema', () => {
    const schema = RpcSchema.from<
      | RpcSchema.Default
      | {
          Request: {
            method: 'custom_method'
            params: [id: number]
          }
          ReturnType: string
        }
    >()

    const provider = Provider.from(
      {
        request: async (args) => args,
      },
      { schema },
    )

    expectTypeOf(provider.request).toBeFunction()

    // Validate custom method exists and is typed correctly
    expectTypeOf(
      provider.request({
        method: 'custom_method',
        params: [123],
      }),
    ).resolves.toEqualTypeOf<string>()

    // Validate default methods still exist
    expectTypeOf(
      provider.request({ method: 'eth_blockNumber' }),
    ).resolves.toEqualTypeOf<`0x${string}`>()
  })

  test('with emitter', () => {
    const emitter = Provider.createEmitter()
    const provider = Provider.from({
      ...emitter,
      request: async (args) => args,
    })

    expectTypeOf(provider.request).toBeFunction()
    expectTypeOf(provider.on).toBeFunction()
    expectTypeOf(provider.emit).toBeFunction()

    // Validate event map exists and events are typed correctly
    provider.on('accountsChanged', (accounts) => {
      expectTypeOf(accounts).toEqualTypeOf<readonly `0x${string}`[]>()
    })
    provider.on('chainChanged', (chainId) => {
      expectTypeOf(chainId).toEqualTypeOf<string>()
    })
    provider.on('connect', (connectInfo) => {
      expectTypeOf(connectInfo).toMatchTypeOf<{ chainId: string }>()
    })
    provider.on('disconnect', (error) => {
      expectTypeOf(error).toMatchTypeOf<Provider.ProviderRpcError>()
    })
  })

  test('with custom emitter event map', () => {
    const emitter = Provider.createEmitter<{
      custom: (data: string) => void
      walletUpdated: (wallet: { address: string; balance: bigint }) => void
    }>()

    const provider = Provider.from({
      ...emitter,
      request: async (args) => args,
    })

    expectTypeOf(provider.request).toBeFunction()
    expectTypeOf(provider.on).toBeFunction()
    expectTypeOf(provider.emit).toBeFunction()

    // Validate custom events are available on provider
    provider.on('custom', (data) => {
      expectTypeOf(data).toEqualTypeOf<string>()
    })

    provider.on('walletUpdated', (wallet) => {
      expectTypeOf(wallet).toEqualTypeOf<{ address: string; balance: bigint }>()
    })

    // Validate default events still exist
    provider.on('accountsChanged', (accounts) => {
      expectTypeOf(accounts).toEqualTypeOf<readonly `0x${string}`[]>()
    })
  })
})

describe('Provider.parseError', () => {
  test('user rejected request error', () => {
    const error = Provider.parseError({
      code: 4001,
      message: 'User rejected',
    })
    expectTypeOf(error).toMatchTypeOf<Provider.UserRejectedRequestError>()
  })

  test('unauthorized error', () => {
    const error = Provider.parseError({
      code: 4100,
      message: 'Unauthorized',
    })
    expectTypeOf(error).toMatchTypeOf<Provider.UnauthorizedError>()
  })

  test('unsupported method error', () => {
    const error = Provider.parseError({
      code: 4200,
      message: 'Unsupported method',
    })
    expectTypeOf(error).toMatchTypeOf<Provider.UnsupportedMethodError>()
  })

  test('disconnected error', () => {
    const error = Provider.parseError({
      code: 4900,
      message: 'Disconnected',
    })
    expectTypeOf(error).toMatchTypeOf<Provider.DisconnectedError>()
  })

  test('chain disconnected error', () => {
    const error = Provider.parseError({
      code: 4901,
      message: 'Chain disconnected',
    })
    expectTypeOf(error).toMatchTypeOf<Provider.ChainDisconnectedError>()
  })

  test('switch chain error', () => {
    const error = Provider.parseError({
      code: 4902,
      message: 'Switch chain error',
    })
    expectTypeOf(error).toMatchTypeOf<Provider.SwitchChainError>()
  })

  test('unknown error code', () => {
    const error = Provider.parseError({
      code: 9999,
      message: 'Unknown',
    })
    expectTypeOf(error).toBeObject()
  })

  test('generic error', () => {
    const error = Provider.parseError(new Error('Generic error'))
    expectTypeOf(error).toBeObject()
  })
})

describe('Provider type', () => {
  test('default', () => {
    type provider = Provider.Provider
    expectTypeOf<provider>().toHaveProperty('request')
  })

  test('with schema', () => {
    const schema = RpcSchema.from<
      | RpcSchema.Default
      | {
          Request: {
            method: 'custom_method'
            params: [id: number]
          }
          ReturnType: string
        }
    >()

    type provider = Provider.Provider<{ schema: typeof schema }>
    expectTypeOf<provider>().toHaveProperty('request')
  })

  test('with event map', () => {
    type provider = Provider.Provider<undefined, true>
    expectTypeOf<provider>().toHaveProperty('request')
    expectTypeOf<provider>().toHaveProperty('on')
    expectTypeOf<provider>().toHaveProperty('emit')
  })
})
