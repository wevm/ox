import type * as Errors from '../../Errors.js'
import type * as RpcSchema from '../../RpcSchema.js'
import { RpcResponse_parse } from '../RpcResponse/parse.js'
import { Provider_IsUndefinedError } from './errors.js'
import type { Provider, Provider_Options } from './types.js'

export function Provider_from<
  const provider extends Provider | unknown,
  options extends Provider_Options | undefined = undefined,
>(
  provider: provider | Provider<{ schema: RpcSchema.Generic }>,
  options?: options | Provider_Options,
): Provider<options>

/**
 * Instantiates an [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) {@link ox#Provider.Provider}
 * from an arbitrary [EIP-1193 Provider](https://eips.ethereum.org/EIPS/eip-1193) interface.
 *
 * @example
 * ### Instantiating with RPC Transport
 *
 * Ox's {@link ox#RpcTransport} is EIP-1193 compliant, and can be used to instantiate an EIP-1193 Provider. This means you can use any HTTP RPC endpoint as an EIP-1193 Provider.
 *
 * ```ts twoslash
 * import { Provider, RpcTransport } from 'ox'
 *
 * const transport = RpcTransport.fromHttp('https://1.rpc.thirdweb.com')
 * const provider = Provider.from(transport)
 * ```
 *
 * @example
 * ### Instantiating with External Providers
 *
 * The example below demonstrates how we can instantiate a typed EIP-1193 Provider from an
 * external EIP-1193 Provider like `window.ethereum`.
 *
 * ```ts twoslash
 * import 'ox/window'
 * import { Provider } from 'ox'
 *
 * const provider = Provider.from(window.ethereum)
 *
 * const blockNumber = await provider.request({ method: 'eth_blockNumber' })
 * ```
 *
 * :::tip
 *
 * There are also libraries that distribute EIP-1193 Provider objects that you can use with `Provider.from`:
 *
 * - [`@walletconnect/ethereum-provider`](https://www.npmjs.com/package/\@walletconnect/ethereum-provider)
 *
 * - [`@coinbase/wallet-sdk`](https://www.npmjs.com/package/\@coinbase/wallet-sdk)
 *
 * - [`@metamask/detect-provider`](https://www.npmjs.com/package/\@metamask/detect-provider)
 *
 * - [`@safe-global/safe-apps-provider`](https://github.com/safe-global/safe-apps-sdk/tree/main/packages/safe-apps-provider)
 *
 * - [`mipd`](https://github.com/wevm/mipd): EIP-6963 Multi Injected Providers
 *
 * :::
 *
 * @example
 * ### Instantiating a Custom Provider
 *
 * The example below demonstrates how we can instantiate a typed EIP-1193 Provider from a
 * HTTP `fetch` JSON-RPC request. You can use this pattern to integrate with any asynchronous JSON-RPC
 * transport, including WebSockets and IPC.
 *
 * ```ts twoslash
 * import { Provider, RpcRequest, RpcResponse } from 'ox'
 *
 * const store = RpcRequest.createStore()
 *
 * const provider = Provider.from({
 *   async request(args) {
 *     return await fetch('https://1.rpc.thirdweb.com', {
 *       body: JSON.stringify(store.prepare(args)),
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *       },
 *     })
 *       .then((res) => res.json())
 *       .then(RpcResponse.parse)
 *   },
 * })
 *
 * const blockNumber = await provider.request({ method: 'eth_blockNumber' })
 * ```
 *
 * @example
 * ### Instantiating a Provider with Events
 *
 * The example below demonstrates how to instantiate a Provider with your own EIP-1193 flavored event emitter.
 *
 * This example is useful for Wallets that distribute an EIP-1193 Provider (e.g. webpage injection via `window.ethereum`).
 *
 * ```ts twoslash
 * import { Provider, RpcRequest, RpcResponse } from 'ox'
 *
 * // 1. Instantiate a Provider Emitter.
 * const emitter = Provider.createEmitter() // [!code ++]
 *
 * const store = RpcRequest.createStore()
 *
 * const provider = Provider.from({
 *   // 2. Pass the Emitter to the Provider.
 *   ...emitter, // [!code ++]
 *   async request(args) {
 *     return await fetch('https://1.rpc.thirdweb.com', {
 *       body: JSON.stringify(store.prepare(args)),
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *       },
 *     })
 *       .then((res) => res.json())
 *       .then(RpcResponse.parse)
 *   },
 * })
 *
 * // 3. Emit Provider Events.
 * emitter.emit('accountsChanged', ['0x...']) // [!code ++]
 * ```
 *
 * @param provider - The EIP-1193 provider to convert.
 * @returns An typed EIP-1193 Provider.
 */
export function Provider_from(
  provider: any,
  options: Provider_Options = {},
): Provider<Provider_Options> {
  const { includeEvents = true } = options
  if (!provider) throw new Provider_IsUndefinedError()
  return {
    ...(includeEvents
      ? {
          on: provider.on?.bind(provider),
          removeListener: provider.removeListener?.bind(provider),
        }
      : {}),
    async request(args) {
      const result = await provider.request(args)
      if (
        typeof result === 'object' &&
        'jsonrpc' in (result as { jsonrpc?: unknown })
      )
        return RpcResponse_parse(result) as never
      return result
    },
  }
}

export declare namespace Provider_from {
  type ErrorType = Provider_IsUndefinedError | Errors.GlobalErrorType
}

/* v8 ignore next */
Provider_from.parseError = (error: unknown) => error as Provider_from.ErrorType
