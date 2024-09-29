import type { GlobalErrorType } from '../Errors/error.js'
import type { RpcNamespace_MethodGeneric } from '../RpcNamespace/types.js'
import { RpcRequest_from } from './from.js'
import type { RpcRequest_Store } from './types.js'

/**
 * Creates a JSON-RPC request store to build requests with an incrementing `id`.
 *
 * Returns a type-safe `prepare` function to build a JSON-RPC request object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#request_object).
 *
 * @example
 * ```ts twoslash
 * import { RpcRequest } from 'ox'
 *
 * const store = RpcRequest.createStore()
 *
 * const request_1 = store.prepare({
 *   method: 'eth_blockNumber',
 * })
 * // @log: { id: 0, jsonrpc: '2.0', method: 'eth_blockNumber' }
 *
 * const request_2 = store.prepare({
 *   method: 'eth_call',
 *   params: [
 *     {
 *       to: '0x0000000000000000000000000000000000000000',
 *       data: '0xdeadbeef',
 *     },
 *   ],
 * })
 * // @log: { id: 1, jsonrpc: '2.0', method: 'eth_call', params: [{ to: '0x0000000000000000000000000000000000000000', data: '0xdeadbeef' }] }
 * ```
 *
 * @example
 * ### Type-safe Custom Methods
 *
 * It is possible to define your own type-safe {@link ox#RpcNamespace.Method} by using the {@link ox#RpcNamespace.DefineMethod} type.
 *
 * ```ts twoslash
 * import { RpcNamespace, RpcRequest } from 'ox'
 *
 * type Method = RpcNamespace.DefineMethod<{ // [!code focus]
 *   method: 'eth_foobar' // [!code focus]
 *   params: [number] // [!code focus]
 *   returnType: string // [!code focus]
 * } | { // [!code focus]
 *   method: 'eth_foobaz' // [!code focus]
 *   params: [string] // [!code focus]
 *   returnType: string // [!code focus]
 * }> // [!code focus]
 *
 * const store = RpcRequest.createStore<Method>() // [!code focus]
 *
 * const request = store.prepare({
 *   method: 'eth_foobar', // [!code focus]
 *   // ^?
 *   params: [42],
 * })
 * ```
 *
 * @param options - Request store options.
 * @returns The request store
 */
export function RpcRequest_createStore<
  method extends RpcNamespace_MethodGeneric | undefined = undefined,
>(
  options: RpcRequest_createStore.Options = {},
): RpcRequest_createStore.ReturnType<method> {
  let id = options.id ?? 0
  return {
    prepare(options) {
      return RpcRequest_from({
        id: id++,
        ...options,
      } as never) as never
    },
    get id() {
      return id
    },
  }
}

export declare namespace RpcRequest_createStore {
  type Options = {
    /** The initial request ID. */
    id?: number
  }

  type ReturnType<method extends RpcNamespace_MethodGeneric | undefined> =
    RpcRequest_Store<method>

  type ErrorType = GlobalErrorType
}

RpcRequest_createStore.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as RpcRequest_createStore.ErrorType
