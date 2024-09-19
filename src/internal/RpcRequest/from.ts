import type { GlobalErrorType } from '../Errors/error.js'
import type { IsNever } from '../types.js'
import type {
  RpcRequest,
  RpcRequest_ExtractMethodParameters,
  RpcRequest_Method,
  RpcRequest_MethodGeneric,
  RpcRequest_MethodNameGeneric,
} from './types.js'

/**
 * A type-safe interface to build a JSON-RPC request object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#request_object).
 *
 * :::warning
 *
 * You will likely want to use {@link ox#RpcRequest.(createStore:function)} instead as it will also manage `id`s and uses this function internally.
 *
 * :::
 *
 * @example
 * ```ts twoslash
 * import { RpcRequest, RpcResponse } from 'ox'
 *
 * // 1. Build a request object.
 * const request = RpcRequest.from({ // [!code focus]
 *   id: 0, // [!code focus]
 *   method: 'eth_estimateGas', // [!code focus]
 *   params: [ // [!code focus]
 *     { // [!code focus]
 *       from: '0xd2135CfB216b74109775236E36d4b433F1DF507B', // [!code focus]
 *       to: '0x0D44f617435088c947F00B31160f64b074e412B4', // [!code focus]
 *       value: '0x69420', // [!code focus]
 *     }, // [!code focus]
 *   ], // [!code focus]
 * }) // [!code focus]
 *
 * // 2. Send the JSON-RPC request via HTTP.
 * const gas = await fetch('https://1.rpc.thirdweb.com', {
 *   body: JSON.stringify(request),
 *   headers: {
 *     'Content-Type': 'application/json',
 *   },
 *   method: 'POST',
 * })
 *  .then((response) => response.json())
 *  // 3. Parse the JSON-RPC response into a type-safe result.
 *  .then((response) => RpcResponse.parse(response, { request }))
 * ```
 *
 * @example
 * ### Type-safe Custom Methods
 *
 * It is possible to define your own type-safe {@link ox#RpcRequest.Method} by using the {@link ox#RpcRequest.DefineMethod} type.
 *
 * ```ts twoslash
 * import { RpcRequest } from 'ox'
 *
 * type Method = RpcRequest.DefineMethod<{ // [!code focus]
 *   method: 'eth_foobar' // [!code focus]
 *   params: [number] // [!code focus]
 *   returnType: string // [!code focus]
 * } | { // [!code focus]
 *   method: 'eth_foobaz' // [!code focus]
 *   params: [string] // [!code focus]
 *   returnType: string // [!code focus]
 * }> // [!code focus]
 *
 * const request = RpcRequest.from<Method>({ // [!code focus]
 *   id: 0,
 *   method: 'eth_foobar', // [!code focus]
 *   // ^?
 *   params: [42],
 * })
 * ```
 *
 * @param options - JSON-RPC request options.
 * @returns The fully-formed JSON-RPC request object.
 */
export function RpcRequest_from<
  method extends RpcRequest_MethodGeneric | RpcRequest_MethodNameGeneric,
>(
  options: RpcRequest_from.Options<method>,
): RpcRequest_from.ReturnType<method> {
  return {
    ...options,
    jsonrpc: '2.0',
  } as never
}

export declare namespace RpcRequest_from {
  type Options<
    method extends RpcRequest_MethodGeneric | RpcRequest_MethodNameGeneric,
  > = RpcRequest_ExtractMethodParameters<method> & { id: number }

  type ReturnType<
    method extends RpcRequest_MethodGeneric | RpcRequest_MethodNameGeneric,
  > = RpcRequest<
    method extends RpcRequest_MethodGeneric
      ? method
      : IsNever<Extract<RpcRequest_Method, { method: method }>> extends true
        ? { method: method; params?: unknown[] | undefined }
        : Extract<RpcRequest_Method, { method: method }>
  >

  type ErrorType = GlobalErrorType
}

RpcRequest_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as RpcRequest_from.ErrorType
