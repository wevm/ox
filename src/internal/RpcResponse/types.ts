import type { Compute, OneOf } from '../types.js'

/** A JSON-RPC response object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#request_object). */
export type RpcResponse<
  result = unknown,
  error extends RpcResponse_ErrorObject = RpcResponse_ErrorObject,
> = Compute<
  {
    id: number
    jsonrpc: '2.0'
  } & OneOf<{ result: result } | { error: error }>
>

/** JSON-RPC error object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#error_object). */
export type RpcResponse_ErrorObject = {
  code: number
  message: string
  data?: unknown | undefined
}
