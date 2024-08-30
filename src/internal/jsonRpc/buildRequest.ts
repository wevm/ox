import type { GlobalErrorType } from '../errors/error.js'
import type {
  JsonRpc_Method,
  JsonRpc_MethodGeneric,
  JsonRpc_MethodName,
  JsonRpc_MethodNameGeneric,
  JsonRpc_Request,
} from './types.js'

/**
 * A type-safe interface to build a JSON-RPC request object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#request_object).
 *
 * @example
 * ```ts twoslash
 * import { JsonRpc } from 'ox'
 *
 * const request = JsonRpc.buildRequest({
 *   id: 0,
 *   method: 'eth_estimateGas',
 *   params: [
 *     {
 *       from: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
 *       to: '0x0D44f617435088c947F00B31160f64b074e412B4',
 *       value: '0x69420',
 *     },
 *   ],
 * })
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
 * const request = JsonRpc.buildRequest<Method>({ // [!code focus]
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
export function JsonRpc_buildRequest<
  method extends JsonRpc_MethodGeneric | JsonRpc_MethodNameGeneric,
>(
  options: JsonRpc_buildRequest.Options<method>,
): JsonRpc_buildRequest.ReturnType<method> {
  return {
    ...options,
    jsonrpc: '2.0',
  } as never
}

export declare namespace JsonRpc_buildRequest {
  type Options<
    method extends JsonRpc_MethodGeneric | JsonRpc_MethodNameGeneric,
  > = GetMethod<method> & { id: number }

  type ReturnType<
    method extends JsonRpc_MethodGeneric | JsonRpc_MethodNameGeneric,
  > = JsonRpc_Request<
    method extends JsonRpc_MethodGeneric
      ? method
      : Extract<JsonRpc_Method, { method: method }>
  >

  type ErrorType = GlobalErrorType
}

JsonRpc_buildRequest.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as JsonRpc_buildRequest.ErrorType

////////////////////////////////////////////////////////////////////////
// Internal
////////////////////////////////////////////////////////////////////////

/** @internal */
export type GetMethod<
  method extends JsonRpc_MethodGeneric | JsonRpc_MethodNameGeneric,
> = {
  method: method extends JsonRpc_MethodGeneric
    ? method['method']
    : method | JsonRpc_MethodName
} & (method extends JsonRpc_MethodGeneric
  ? Omit<method, 'method' | 'returnType'>
  : {
      params?: readonly unknown[] | undefined
    } & (method extends JsonRpc_MethodName
      ? Omit<Extract<JsonRpc_Method, { method: method }>, 'returnType'>
      : { method: string }))
