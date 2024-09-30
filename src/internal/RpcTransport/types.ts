import type { RpcResponse } from '../RpcResponse/types.js'
import type {
  RpcSchema_Extract,
  RpcSchema_ExtractReturnType,
  RpcSchema_Generic,
  RpcSchema_NameGeneric,
} from '../RpcSchema/types.js'
import type { Compute } from '../types.js'

/** Root type for an RPC Transport. */
export type RpcTransport<
  safe extends boolean = false,
  options extends Record<string, unknown> = {},
> = Compute<{
  request: RpcTransport_RequestFn<safe, options>
}>

/** HTTP-based RPC Transport. */
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
        method: Omit<RpcSchema_Generic, 'returnType'>,
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
  method extends RpcSchema_Generic | RpcSchema_NameGeneric,
  safe_override extends boolean | undefined = undefined,
>(
  parameters: Compute<Omit<RpcSchema_Extract<method>, 'returnType'>>,
  options?: RpcTransport_Options<safe_override, options> | undefined,
) => Promise<
  safe_override extends boolean
    ? safe_override extends true
      ? RpcResponse<RpcSchema_ExtractReturnType<method>>
      : RpcSchema_ExtractReturnType<method>
    : safe extends true
      ? RpcResponse<RpcSchema_ExtractReturnType<method>>
      : RpcSchema_ExtractReturnType<method>
>
