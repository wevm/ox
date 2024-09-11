import type { GlobalErrorType } from '../Errors/error.js'
import { Provider_IsUndefinedError } from './errors.js'
import type { Provider } from './types.js'

/**
 * Instantiates an [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) {@link ox#Provider.Provider}
 * from an arbitrary [EIP-1193 Provider](https://eips.ethereum.org/EIPS/eip-1193) interface.
 *
 * @example
 * ### Instantiating with `window.ethereum`
 *
 * The example below demonstrates how we can instantiate a typed EIP-1193 Provider from a
 * global `window.ethereum` object.
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
 * TODO
 *
 * @param provider - The EIP-1193 provider to convert.
 * @returns An typed EIP-1193 Provider.
 */
export function Provider_from<provider extends Provider | unknown>(
  provider: provider | Provider,
): provider extends Provider ? provider : Provider {
  if (!provider) throw new Provider_IsUndefinedError()
  return provider as never
}

export declare namespace Provider_from {
  type ErrorType = Provider_IsUndefinedError | GlobalErrorType
}
