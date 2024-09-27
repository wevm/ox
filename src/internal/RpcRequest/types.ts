import type { Compute } from '../types.js'
import type { RpcRequest_from } from './from.js'
import type {
  RpcRequest_MethodEth,
  RpcRequest_MethodNameEth,
  RpcRequest_MethodsEth,
} from './namespaces/eth.js'

/** A JSON-RPC request object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#request_object). */
export type RpcRequest<
  method extends RpcRequest_MethodGeneric = RpcRequest_MethodGeneric,
> = Compute<
  Omit<method, 'returnType'> & {
    id: number
    jsonrpc: '2.0'
    _returnType: method['returnType']
  }
>

/** JSON-RPC request store type. */
export type RpcRequest_Store<
  method extends RpcRequest_MethodGeneric | undefined,
> = Compute<{
  prepare: <
    method_inferred extends
      | RpcRequest_MethodGeneric
      | RpcRequest_MethodNameGeneric,
  >(
    parameters: RpcRequest_ExtractMethodParameters<
      method extends RpcRequest_MethodGeneric ? method : method_inferred
    >,
  ) => RpcRequest_from.ReturnType<
    method extends RpcRequest_MethodGeneric ? method : method_inferred
  >
  readonly id: number
}>

/** Extracts a method from a {@link ox#RpcRequest.MethodGeneric} or {@link ox#RpcRequest.MethodNameGeneric}. */
export type RpcRequest_ExtractMethod<
  method extends RpcRequest_MethodGeneric | RpcRequest_MethodNameGeneric,
> = {
  method: method extends RpcRequest_MethodGeneric
    ? method['method']
    : method | RpcRequest_MethodName
} & (method extends RpcRequest_MethodGeneric
  ? method
  : {
      params?: unknown[] | undefined
      returnType: unknown
    } & (method extends RpcRequest_MethodName
      ? Extract<RpcRequest_Method, { method: method }>
      : { method: string }))

/** Extracts parameters from a {@link ox#RpcRequest.MethodGeneric} or {@link ox#RpcRequest.MethodNameGeneric}. */
export type RpcRequest_ExtractMethodParameters<
  method extends RpcRequest_MethodGeneric | RpcRequest_MethodNameGeneric,
> = Omit<RpcRequest_ExtractMethod<method>, 'returnType'>

/** Extracts return type from a {@link ox#RpcRequest.MethodGeneric} or {@link ox#RpcRequest.MethodNameGeneric}. */
export type RpcRequest_ExtractMethodReturnType<
  method extends RpcRequest_MethodGeneric | RpcRequest_MethodNameGeneric,
> = RpcRequest_ExtractMethod<method>['returnType']

////////////////////////////////////////////////////////////////
// Define Method
////////////////////////////////////////////////////////////////

/**
 * Type to define a custom type-safe JSON-RPC Method to be used with {@link ox#RpcRequest.(from:function)}.
 *
 * @example
 * ```ts twoslash
 * import { RpcRequest } from 'ox'
 *
 * type Eth_Foobar = RpcRequest.DefineMethod<{
 *   method: 'eth_foobar',
 *   params: [id: number],
 *   returnType: string
 * }>
 * const request = RpcRequest.from<Eth_Foobar>({
 *   id: 0,
 *   method: 'eth_foobar',
 *   params: [0],
 * })
 * ```
 */
export type RpcRequest_DefineMethod<method extends RpcRequest_MethodGeneric> =
  method

////////////////////////////////////////////////////////////////
// Generic
////////////////////////////////////////////////////////////////

/** Generic type to define a JSON-RPC Method. */
export type RpcRequest_MethodGeneric<
  name extends string = string,
  params extends unknown[] | undefined = unknown[] | undefined,
> = {
  method: name
  params?: params | undefined
  returnType?: unknown
}

/** Generic type to define a JSON-RPC Method Name. */
export type RpcRequest_MethodNameGeneric =
  | RpcRequest_MethodNameEth
  | (string & {})

////////////////////////////////////////////////////////////////
// All Methods
////////////////////////////////////////////////////////////////

/** Type-safe set of all JSON-RPC Methods. */
export type RpcRequest_Methods = RpcRequest_MethodsEth

/** Type-safe union of all JSON-RPC Methods. */
export type RpcRequest_Method = RpcRequest_MethodEth

/** Type-safe union of all JSON-RPC Method Names. */
export type RpcRequest_MethodName = RpcRequest_MethodNameEth
