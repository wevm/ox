import { EventEmitter } from 'eventemitter3'
import type * as Errors from '../../Errors.js'
import type { Provider_Emitter, Provider_EventMap } from './types.js'

/**
 * Creates an EIP-1193 flavored event emitter to be injected onto a Provider.
 *
 * @example
 * ```ts twoslash
 * import { Provider, RpcRequest, RpcResponse } from 'ox' // [!code focus]
 *
 * // 1. Instantiate a Provider Emitter. // [!code focus]
 * const emitter = Provider.createEmitter() // [!code focus]
 *
 * const store = RpcRequest.createStore()
 *
 * const provider = Provider.from({
 *   // 2. Pass the Emitter to the Provider. // [!code focus]
 *   ...emitter, // [!code focus]
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
 * // 3. Emit Provider Events. // [!code focus]
 * emitter.emit('accountsChanged', ['0x...']) // [!code focus]
 * ```
 *
 * @returns An event emitter.
 */
export function Provider_createEmitter(): Provider_Emitter {
  const emitter = new EventEmitter<Provider_EventMap>()

  return {
    get eventNames() {
      return emitter.eventNames.bind(emitter)
    },
    get listenerCount() {
      return emitter.listenerCount.bind(emitter)
    },
    get listeners() {
      return emitter.listeners.bind(emitter)
    },
    addListener: emitter.addListener.bind(emitter),
    emit: emitter.emit.bind(emitter),
    off: emitter.off.bind(emitter),
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),
    removeListener: emitter.removeListener.bind(emitter),
  }
}

export declare namespace Provider_createEmitter {
  type ErrorType = Errors.GlobalErrorType
}

Provider_createEmitter.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Provider_createEmitter.ErrorType
