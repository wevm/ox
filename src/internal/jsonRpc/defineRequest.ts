import type { GlobalErrorType } from '../errors/error.js'
import type {
  JsonRpc_ExtractMethodParameters,
  JsonRpc_Method,
  JsonRpc_MethodGeneric,
  JsonRpc_MethodNameGeneric,
  JsonRpc_Request,
} from './types.js'

/**
 * A type-safe interface to build a JSON-RPC request object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#request_object).
 *
 * :::warning
 * You will likely want to use {@link JsonRpc#createRequestStore} instead as it will also manage `id`s and uses this function internally.
 * :::
 *
 * @example
 * ```ts twoslash
 * import { JsonRpc } from 'ox'
 *
 * // 1. Build a request object.
 * const request = JsonRpc.defineRequest({ // [!code focus]
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
 * const gas = await fetch('https://cloudflare-eth.com', {
 *   body: JSON.stringify(request),
 *   headers: {
 *     'Content-Type': 'application/json',
 *   },
 *   method: 'POST',
 * })
 *  .then((res) => res.json())
 *  // 3. Parse the JSON-RPC response into a type-safe result.
 *  .then((res) => JsonRpc.parseResponse(res, { method: 'eth_estimateGas' }))
 * ```
 *
 * @example
 * ### Type-safe Custom Methods
 *
 * It is possible to define your own type-safe {@link JsonRpc#Method} by using the {@link JsonRpc#DefineMethod} type.
 *
 * ```ts twoslash
 * import { JsonRpc } from 'ox'
 *
 * type Method = JsonRpc.DefineMethod<{ // [!code focus]
 *   method: 'eth_foobar' // [!code focus]
 *   params: [number] // [!code focus]
 *   returnType: string // [!code focus]
 * } | { // [!code focus]
 *   method: 'eth_foobaz' // [!code focus]
 *   params: [string] // [!code focus]
 *   returnType: string // [!code focus]
 * }> // [!code focus]
 *
 * const request = JsonRpc.defineRequest<Method>({ // [!code focus]
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
export function JsonRpc_defineRequest<
  method extends JsonRpc_MethodGeneric | JsonRpc_MethodNameGeneric,
>(
  options: JsonRpc_defineRequest.Options<method>,
): JsonRpc_defineRequest.ReturnType<method> {
  return {
    ...options,
    jsonrpc: '2.0',
  } as never
}

export declare namespace JsonRpc_defineRequest {
  type Options<
    method extends JsonRpc_MethodGeneric | JsonRpc_MethodNameGeneric,
  > = JsonRpc_ExtractMethodParameters<method> & { id: number }

  type ReturnType<
    method extends JsonRpc_MethodGeneric | JsonRpc_MethodNameGeneric,
  > = JsonRpc_Request<
    method extends JsonRpc_MethodGeneric
      ? method
      : Extract<JsonRpc_Method, { method: method }>
  >

  type ErrorType = GlobalErrorType
}

JsonRpc_defineRequest.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as JsonRpc_defineRequest.ErrorType
