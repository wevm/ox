import type { GlobalErrorType } from '../Errors/error.js'
import { RpcRequest_createStore } from '../RpcRequest/createStore.js'
import type { RpcRequest } from '../RpcRequest/types.js'
import { RpcResponse_parse } from '../RpcResponse/parse.js'
import type { RpcResponse } from '../RpcResponse/types.js'
import type { Compute } from '../types.js'
import type { RpcTransport_Options, RpcTransport } from './types.js'

/** @internal */
export function RpcTransport_create<
  options extends Record<string, unknown> = {},
  safe extends boolean = false,
>(
  transport: RpcTransport_create.Transport<options>,
  options_root: RpcTransport_create.Options<safe> = {},
): RpcTransport<safe> {
  const requestStore = RpcRequest_createStore()

  return {
    request: async ({ method, params }, options = {}) => {
      const body = requestStore.prepare({ method, params } as never)

      const data = await transport.request(body, options as never)

      return RpcResponse_parse(data, {
        safe: options.safe ?? options_root.safe,
      }) as never
    },
  }
}

/** @internal */
export declare namespace RpcTransport_create {
  type Transport<options extends Record<string, unknown> = {}> = {
    request: (
      body: Compute<Omit<RpcRequest, '_returnType'>>,
      options: options,
    ) => Promise<RpcResponse>
  }

  type Options<safe extends boolean = false> = RpcTransport_Options<safe>

  type ErrorType =
    | RpcRequest_createStore.ErrorType
    | RpcResponse_parse.ErrorType
    | GlobalErrorType
}

/** @internal */
RpcTransport_create.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as RpcTransport_create.ErrorType
