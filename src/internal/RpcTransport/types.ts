import type {
  RpcRequest_ExtractMethodParameters,
  RpcRequest_ExtractMethodReturnType,
  RpcRequest_MethodGeneric,
  RpcRequest_MethodNameGeneric,
} from '../RpcRequest/types.js'
import type { Compute } from '../types.js'
import type { RpcResponse } from '../RpcResponse/types.js'

export type RpcTransport<
  safe extends boolean = false,
  options extends Record<string, unknown> = {},
> = Compute<{
  request: RpcTransport_RequestFn<safe, options>
}>

export type RpcTransport_Http<safe extends boolean = false> = RpcTransport<
  safe,
  RpcTransport_HttpOptions
>

////////////////////////////////////////////////////////////////////////
// Options
////////////////////////////////////////////////////////////////////////

export type RpcTransport_Options<
  safe extends boolean | undefined = undefined,
  options extends Record<string, unknown> = {},
> = {
  /**
   * Enables safe mode – responses will return an object with `result` and `error` properties instead of returning the `result` directly and throwing errors.
   *
   * - `true`: a JSON-RPC response object will be returned with `result` and `error` properties.
   * - `false`: the JSON-RPC response object's `result` property will be returned directly, and JSON-RPC Errors will be thrown.
   *
   * @default false
   */
  safe?: safe | boolean | undefined
} & options

export type RpcTransport_HttpOptions = {
  /** Request configuration to pass to `fetch`. */
  fetchOptions?:
    | Omit<RequestInit, 'body'>
    | ((
        method: Omit<RpcRequest_MethodGeneric, 'returnType'>,
      ) => Omit<RequestInit, 'body'> | Promise<Omit<RequestInit, 'body'>>)
    | undefined
  /** Function to use to make the request. @default fetch */
  fetchFn?: typeof fetch | undefined
  /** Timeout for the request in milliseconds. @default 10_000 */
  timeout?: number | undefined
}

////////////////////////////////////////////////////////////////////////
// `transport.request` Types
////////////////////////////////////////////////////////////////////////

export type RpcTransport_RequestFn<
  safe extends boolean = false,
  options extends Record<string, unknown> = {},
> = <
  method extends RpcRequest_MethodGeneric | RpcRequest_MethodNameGeneric,
  safe_override extends boolean | undefined = undefined,
>(
  method: RpcRequest_ExtractMethodParameters<method>,
  options?: RpcTransport_Options<safe_override, options> | undefined,
) => Promise<
  safe_override extends boolean
    ? safe_override extends true
      ? RpcResponse<RpcRequest_ExtractMethodReturnType<method>>
      : RpcRequest_ExtractMethodReturnType<method>
    : safe extends true
      ? RpcResponse<RpcRequest_ExtractMethodReturnType<method>>
      : RpcRequest_ExtractMethodReturnType<method>
>
