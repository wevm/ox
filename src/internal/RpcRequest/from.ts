import type * as Errors from '../../Errors.js'
import type * as RpcSchema from '../../RpcSchema.js'
import type { Compute } from '../types.js'
import type { RpcRequest } from './types.js'

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
 * ### Type-safe Custom Schemas
 *
 * It is possible to define your own type-safe RPC Schema by using the {@link ox#RpcSchema.From} type.
 *
 * ```ts twoslash
 * import { RpcSchema, RpcRequest } from 'ox'
 *
 * type Schema = RpcSchema.From<{ // [!code focus]
 *   Request: { // [!code focus]
 *     method: 'eth_foobar' // [!code focus]
 *     params: [number] // [!code focus]
 *   } // [!code focus]
 *   ReturnType: string // [!code focus]
 * } | { // [!code focus]
 *   Request: { // [!code focus]
 *     method: 'eth_foobaz' // [!code focus]
 *     params: [string] // [!code focus]
 *   } // [!code focus]
 *   ReturnType: string // [!code focus]
 * }> // [!code focus]
 *
 * const request = RpcRequest.from<Schema>({ // [!code focus]
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
  schema extends RpcSchema.Generic | RpcSchema.MethodNameGeneric,
>(
  options: RpcRequest_from.Options<schema>,
): RpcRequest_from.ReturnType<schema> {
  return {
    ...options,
    jsonrpc: '2.0',
  } as never
}

export declare namespace RpcRequest_from {
  type Options<schema extends RpcSchema.Generic | RpcSchema.MethodNameGeneric> =
    Compute<RpcSchema.ExtractRequest<schema> & { id: number }>

  type ReturnType<
    schema extends RpcSchema.Generic | RpcSchema.MethodNameGeneric,
  > = Compute<
    RpcRequest<
      schema extends RpcSchema.Generic
        ? schema
        : RpcSchema.ExtractMethod<schema>
    >
  >

  type ErrorType = Errors.GlobalErrorType
}

RpcRequest_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as RpcRequest_from.ErrorType
