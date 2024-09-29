import type {
  RpcNamespace_MethodEth,
  RpcNamespace_MethodNameEth,
  RpcNamespace_MethodsEth,
} from './eth.js'
import type {
  RpcNamespace_MethodNameWallet,
  RpcNamespace_MethodWallet,
  RpcNamespace_MethodsWallet,
} from './wallet.js'

/** Extracts a method from a {@link ox#RpcNamespace.MethodGeneric} or {@link ox#RpcNamespace.MethodNameGeneric}. */
export type RpcNamespace_ExtractMethod<
  method extends RpcNamespace_MethodGeneric | RpcNamespace_MethodNameGeneric,
> = {
  method: method extends RpcNamespace_MethodGeneric
    ? method['method']
    : method | RpcNamespace_MethodName
} & (method extends RpcNamespace_MethodGeneric
  ? method
  : {
      params?: unknown[] | undefined
      returnType: unknown
    } & (method extends RpcNamespace_MethodName
      ? Extract<RpcNamespace_Method, { method: method }>
      : { method: string }))

/** Extracts parameters from a {@link ox#RpcNamespace.MethodGeneric} or {@link ox#RpcNamespace.MethodNameGeneric}. */
export type RpcNamespace_ExtractMethodParameters<
  method extends RpcNamespace_MethodGeneric | RpcNamespace_MethodNameGeneric,
> = Omit<RpcNamespace_ExtractMethod<method>, 'returnType'>

/** Extracts return type from a {@link ox#RpcNamespace.MethodGeneric} or {@link ox#RpcNamespace.MethodNameGeneric}. */
export type RpcNamespace_ExtractMethodReturnType<
  method extends RpcNamespace_MethodGeneric | RpcNamespace_MethodNameGeneric,
> = RpcNamespace_ExtractMethod<method>['returnType']

////////////////////////////////////////////////////////////////
// Define Method
////////////////////////////////////////////////////////////////

/**
 * Type to define a custom type-safe JSON-RPC Method to be used with {@link ox#RpcRequest.(from:function)}.
 *
 * @example
 * ```ts twoslash
 * import { RpcNamespace, RpcRequest } from 'ox'
 *
 * type Eth_Foobar = RpcNamespace.DefineMethod<{
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
export type RpcNamespace_DefineMethod<
  method extends RpcNamespace_MethodGeneric,
> = method

////////////////////////////////////////////////////////////////
// Generic
////////////////////////////////////////////////////////////////

/** Generic type to define a JSON-RPC Method. */
export type RpcNamespace_MethodGeneric<
  name extends string = string,
  params extends unknown[] | undefined = unknown[] | undefined,
> = {
  method: name
  params?: params | undefined
  returnType?: unknown
}

/** Generic type to define a JSON-RPC Method Name. */
export type RpcNamespace_MethodNameGeneric =
  | RpcNamespace_MethodNameEth
  | (string & {})

////////////////////////////////////////////////////////////////
// All Methods
////////////////////////////////////////////////////////////////

/** Type-safe set of all JSON-RPC Methods. */
export type RpcNamespace_Methods =
  | RpcNamespace_MethodsEth
  | RpcNamespace_MethodsWallet

/** Type-safe union of all JSON-RPC Methods. */
export type RpcNamespace_Method =
  | RpcNamespace_MethodEth
  | RpcNamespace_MethodWallet

/** Type-safe union of all JSON-RPC Method Names. */
export type RpcNamespace_MethodName =
  | RpcNamespace_MethodNameEth
  | RpcNamespace_MethodNameWallet
