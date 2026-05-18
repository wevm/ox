import type * as Errors from '../Errors.js'
import type * as RpcRequest from '../RpcRequest.js'
import * as RpcResponse from '../RpcResponse.js'
import type * as RpcSchema from '../RpcSchema.js'
import type * as RpcTransport from '../RpcTransport.js'
import type { Compute } from './types.js'

/** @internal */
export type Options<
  raw extends boolean | undefined = undefined,
  options extends Record<string, unknown> = {},
  schema extends RpcSchema.Generic = RpcSchema.Default,
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
  /**
   * RPC Schema to use for the Transport's `request` function.
   * See {@link ox#RpcSchema.(from:function)} for more.
   *
   * @default `RpcSchema.Default`
   */
  schema?: schema | RpcSchema.Default | undefined
} & options

/** @internal */
export function create<
  options extends Record<string, unknown> = {},
  schema extends RpcSchema.Generic = RpcSchema.Default,
  raw extends boolean = false,
>(
  transport: create.Transport<options>,
  options_root?: Options<raw, options, schema>,
): RpcTransport.RpcTransport<raw, options, schema> {
  let id = 0

  return {
    request: async (request: any, options: any = {}) => {
      // Fast path: if the caller already provided a fully-formed JSON-RPC
      // request (id + jsonrpc), forward it directly without re-allocating.
      const body =
        request.jsonrpc === '2.0' && typeof request.id === 'number'
          ? request
          : { id: id++, ...request, jsonrpc: '2.0' }

      const data = await transport.request(body, options as never)

      return RpcResponse.parse(data, {
        raw: options.raw ?? options_root?.raw,
      }) as never
    },
  }
}

/** @internal */
export declare namespace create {
  type Transport<options extends Record<string, unknown> = {}> = {
    request: (
      body: Compute<Omit<RpcRequest.RpcRequest, '_returnType'>>,
      options: options,
    ) => Promise<RpcResponse.RpcResponse>
  }

  type ErrorType =
    | RpcRequest.createStore.ErrorType
    | RpcResponse.parse.ErrorType
    | Errors.GlobalErrorType
}
