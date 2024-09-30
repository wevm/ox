import type {
  RpcNamespace_ExtractMethodParameters,
  RpcNamespace_MethodGeneric,
  RpcNamespace_MethodNameGeneric,
} from '../RpcNamespace/types.js'
import type { Compute } from '../types.js'
import type { RpcRequest_from } from './from.js'

/** A JSON-RPC request object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#request_object). */
export type RpcRequest<
  method extends RpcNamespace_MethodGeneric = RpcNamespace_MethodGeneric,
> = Compute<
  Omit<method, 'returnType'> & {
    id: number
    jsonrpc: '2.0'
    /** @deprecated */
    _returnType: method['returnType']
  }
>

/** JSON-RPC request store type. */
export type RpcRequest_Store<
  method extends RpcNamespace_MethodGeneric | undefined,
> = Compute<{
  prepare: <
    method_inferred extends
      | RpcNamespace_MethodGeneric
      | RpcNamespace_MethodNameGeneric,
  >(
    parameters: RpcNamespace_ExtractMethodParameters<
      method extends RpcNamespace_MethodGeneric ? method : method_inferred
    >,
  ) => RpcRequest_from.ReturnType<
    method extends RpcNamespace_MethodGeneric ? method : method_inferred
  >
  readonly id: number
}>
