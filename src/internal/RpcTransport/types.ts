import type { RpcResponse } from '../RpcResponse/types.js'
import type {
  RpcSchema_ExtractRequest,
  RpcSchema_ExtractReturnType,
  RpcSchema_Generic,
  RpcSchema_MethodNameGeneric,
} from '../RpcSchema/types.js'
import type { Compute } from '../types.js'

/** Root type for an RPC Transport. */
export type RpcTransport<
  raw extends boolean = false,
  options extends Record<string, unknown> = {},
> = Compute<{
  request: RpcTransport_RequestFn<raw, options>
}>

/** HTTP-based RPC Transport. */
export type RpcTransport_Http<raw extends boolean = false> = RpcTransport<
  raw,
  RpcTransport_HttpOptions
>

////////////////////////////////////////////////////////////////////////
// Options
////////////////////////////////////////////////////////////////////////

export type RpcTransport_Options<
  raw extends boolean | undefined = undefined,
  options extends Record<string, unknown> = {},
> = {
  /**
   * Enables raw mode – responses will return an object with `result` and `error` properties instead of returning the `result` directly and throwing errors.
   *
   * - `true`: a JSON-RPC response object will be returned with `result` and `error` properties.
   * - `false`: the JSON-RPC response object's `result` property will be returned directly, and JSON-RPC Errors will be thrown.
   *
   * @default false
   */
  raw?: raw | boolean | undefined
} & options

export type RpcTransport_HttpOptions = {
  /** Request configuration to pass to `fetch`. */
  fetchOptions?:
    | Omit<RequestInit, 'body'>
    | ((
        method: RpcSchema_Generic['Request'],
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
  raw extends boolean = false,
  options extends Record<string, unknown> = {},
> = <
  schema extends RpcSchema_Generic | RpcSchema_MethodNameGeneric,
  raw_override extends boolean | undefined = undefined,
>(
  parameters: Compute<RpcSchema_ExtractRequest<schema>>,
  options?: RpcTransport_Options<raw_override, options> | undefined,
) => Promise<
  raw_override extends boolean
    ? raw_override extends true
      ? RpcResponse<RpcSchema_ExtractReturnType<schema>>
      : RpcSchema_ExtractReturnType<schema>
    : raw extends true
      ? RpcResponse<RpcSchema_ExtractReturnType<schema>>
      : RpcSchema_ExtractReturnType<schema>
>
