import type * as Errors from '../../Errors.js'
import * as RpcRequest from '../../RpcRequest.js'
import type * as RpcSchema from '../../RpcSchema.js'
import { RpcResponse_parse } from '../RpcResponse/parse.js'
import type { RpcResponse } from '../RpcResponse/types.js'
import type { Compute } from '../types.js'
import type { RpcTransport, RpcTransport_Options } from './types.js'

/** @internal */
export function RpcTransport_create<
  options extends Record<string, unknown> = {},
  raw extends boolean = false,
  schema extends RpcSchema.Generic = RpcSchema.Default,
>(
  transport: RpcTransport_create.Transport<options>,
  options_root: RpcTransport_create.Options<raw, schema> = {},
): RpcTransport<raw, {}, schema> {
  const requestStore = RpcRequest.createStore()

  return {
    request: async ({ method, params }, options = {}) => {
      const body = requestStore.prepare({ method, params } as never)

      const data = await transport.request(body as never, options as never)

      return RpcResponse_parse(data, {
        safe: options.raw ?? options_root.raw,
      }) as never
    },
  }
}

/** @internal */
export declare namespace RpcTransport_create {
  type Transport<options extends Record<string, unknown> = {}> = {
    request: (
      body: Compute<Omit<RpcRequest.RpcRequest, '_returnType'>>,
      options: options,
    ) => Promise<RpcResponse>
  }

  type Options<
    raw extends boolean = false,
    schema extends RpcSchema.Generic = RpcSchema.Default,
  > = RpcTransport_Options<raw, {}, schema>

  type ErrorType =
    | RpcRequest.createStore.ErrorType
    | RpcResponse_parse.ErrorType
    | Errors.GlobalErrorType
}

/** @internal */
RpcTransport_create.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as RpcTransport_create.ErrorType
