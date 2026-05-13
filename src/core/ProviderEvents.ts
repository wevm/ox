/**
 * Explicit entry point for [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) Provider event
 * helpers. Re-exports {@link ox#Provider.(createEmitter:function)} and the related types so
 * request-only consumers can avoid this module's dependency on `eventemitter3` from their import
 * graph.
 *
 * @example
 * ```ts twoslash
 * import { ProviderEvents } from 'ox'
 *
 * const emitter = ProviderEvents.createEmitter()
 *
 * emitter.on('accountsChanged', (accounts) => {
 *   console.log(accounts)
 * })
 *
 * emitter.emit('accountsChanged', ['0x...'])
 * ```
 */

export {
  /** Re-export of {@link ox#Provider.ConnectInfo}. */
  type ConnectInfo,
  /** Re-export of {@link ox#Provider.(createEmitter:function)}. */
  createEmitter,
  /** Re-export of {@link ox#Provider.Emitter}. */
  type Emitter,
  /** Re-export of {@link ox#Provider.EventMap}. */
  type EventMap,
  /** Re-export of {@link ox#Provider.Message}. */
  type Message,
  /** Re-export of {@link ox#Provider.ProviderRpcError}. */
  ProviderRpcError,
} from './Provider.js'
