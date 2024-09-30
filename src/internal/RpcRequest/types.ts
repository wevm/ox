import type {
  RpcSchema_Extract,
  RpcSchema_Generic,
  RpcSchema_NameGeneric,
} from '../RpcSchema/types.js'
import type { Compute } from '../types.js'
import type { RpcRequest_from } from './from.js'

/** A JSON-RPC request object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#request_object). */
export type RpcRequest<method extends RpcSchema_Generic = RpcSchema_Generic> =
  Compute<
    Omit<method, 'returnType'> & {
      id: number
      jsonrpc: '2.0'
      /** @deprecated internal */
      _returnType: method['returnType']
    }
  >

/** JSON-RPC request store type. */
export type RpcRequest_Store<method extends RpcSchema_Generic | undefined> =
  Compute<{
    prepare: <
      method_inferred extends RpcSchema_Generic | RpcSchema_NameGeneric,
    >(
      parameters: Compute<
        Omit<
          RpcSchema_Extract<
            method extends RpcSchema_Generic ? method : method_inferred
          >,
          'returnType'
        >
      >,
    ) => RpcRequest_from.ReturnType<
      method extends RpcSchema_Generic ? method : method_inferred
    >
    readonly id: number
  }>
