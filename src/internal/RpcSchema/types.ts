import type { Compute } from '../types.js'
import type { RpcSchema_Eip4337, RpcSchema_NameEip4337 } from './eip4337.js'
import type { RpcSchema_Eth, RpcSchema_NameEth } from './eth.js'
import type { RpcSchema_NameWallet, RpcSchema_Wallet } from './wallet.js'

/**
 * Extracts a method from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.NameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Eth_GetBlockByNumber = RpcSchema.Extract<'eth_getBlockByNumber'>
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type RpcSchema_Extract<
  method extends RpcSchema_Generic | RpcSchema_NameGeneric,
> = Compute<
  {
    method: method extends RpcSchema_Generic
      ? method['method']
      : method | RpcSchema_Name
  } & (method extends RpcSchema_Generic
    ? method
    : {
        params?: unknown[] | undefined
        returnType: unknown
      } & (method extends RpcSchema_Name
        ? Extract<RpcSchema_All, { method: method }>
        : { method: string }))
>

/**
 * Extracts parameters from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.NameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Eth_GetBlockByNumber = RpcSchema.ExtractParams<'eth_getBlockByNumber'>
 * //   ^?
 *
 *
 *
 *
 *
 * ```
 */
export type RpcSchema_ExtractParams<
  method extends RpcSchema_Generic | RpcSchema_NameGeneric,
> = RpcSchema_Extract<method>['params']

/**
 * Extracts return type from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.NameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Eth_GetBlockByNumber = RpcSchema.ExtractReturnType<'eth_getBlockByNumber'>
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type RpcSchema_ExtractReturnType<
  method extends RpcSchema_Generic | RpcSchema_NameGeneric,
> = RpcSchema_Extract<method>['returnType']

////////////////////////////////////////////////////////////////
// Define Method
////////////////////////////////////////////////////////////////

/**
 * Type to define a custom type-safe JSON-RPC Method to be used with {@link ox#RpcRequest.(from:function)}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema, RpcRequest } from 'ox'
 *
 * type Eth_Foobar = RpcSchema.Define<{
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
export type RpcSchema_Define<method extends RpcSchema_Generic> = method

////////////////////////////////////////////////////////////////
// Generic
////////////////////////////////////////////////////////////////

/**
 * Generic type to define a JSON-RPC Method.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Method = RpcSchema.Generic
 * //   ^?
 *
 *
 *
 *
 *
 *
 * ```
 */
export type RpcSchema_Generic<
  name extends string = string,
  params extends unknown[] | undefined = unknown[] | undefined,
> = {
  method: name
  params?: params | undefined
  returnType?: unknown
}

/**
 * Generic type to define a JSON-RPC Method Name.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Name = RpcSchema.NameGeneric
 * //   ^?
 *
 *
 *
 *
 *
 * ```
 */
export type RpcSchema_NameGeneric = RpcSchema_NameEth | (string & {})

////////////////////////////////////////////////////////////////
// All Methods
////////////////////////////////////////////////////////////////

/**
 * Type-safe union of all JSON-RPC Methods.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Method = RpcSchema.All
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type RpcSchema_All = RpcSchema_Eth | RpcSchema_Wallet | RpcSchema_Eip4337

/**
 * Type-safe union of all JSON-RPC Method Names.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type MethodName = RpcSchema.Name
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type RpcSchema_Name =
  | RpcSchema_NameEth
  | RpcSchema_NameWallet
  | RpcSchema_NameEip4337
