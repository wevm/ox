import type * as RpcSchema from '../../RpcSchema.js'
import type { Compute } from '../types.js'
import type { RpcRequest_from } from './from.js'

/** A JSON-RPC request object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#request_object). */
export type RpcRequest<schema extends RpcSchema.Generic = RpcSchema.Generic> =
  Compute<
    schema['Request'] & {
      id: number
      jsonrpc: '2.0'
      /** @deprecated internal */
      _returnType: schema['ReturnType']
    }
  >

/** JSON-RPC request store type. */
export type RpcRequest_Store<schema extends RpcSchema.Generic | undefined> =
  Compute<{
    prepare: <
      method_inferred extends RpcSchema.Generic | RpcSchema.MethodNameGeneric,
    >(
      parameters: Compute<
        RpcSchema.ExtractRequest<
          schema extends RpcSchema.Generic ? schema : method_inferred
        >
      >,
    ) => RpcRequest_from.ReturnType<
      schema extends RpcSchema.Generic ? schema : method_inferred
    >
    readonly id: number
  }>
