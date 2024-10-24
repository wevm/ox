import type { IsNarrowable } from 'viem'
import type { Compute } from '../types.js'
import type {
  RpcSchema_Eip4337,
  RpcSchema_MethodNameEip4337,
} from './eip4337.js'
import type { RpcSchema_Eth, RpcSchema_MethodNameEth } from './eth.js'
import type { RpcSchema_MethodNameWallet, RpcSchema_Wallet } from './wallet.js'

/**
 * Extracts a method from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
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
  schema extends RpcSchema_Generic | RpcSchema_MethodNameGeneric,
> = Compute<{
  Request: RpcSchema_ExtractRequest<schema>
  ReturnType: RpcSchema_ExtractReturnType<schema>
}>

/**
 * Extracts return type from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
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
export type RpcSchema_ExtractRequest<
  schema extends RpcSchema_Generic | RpcSchema_MethodNameGeneric,
> = Compute<
  Omit<
    {
      method: schema extends RpcSchema_Generic
        ? schema['Request']['method']
        : schema | RpcSchema_MethodName
      params?: unknown
    } & (schema extends RpcSchema_Generic
      ? schema['Request']
      : IsNarrowable<schema, RpcSchema_MethodName> extends true
        ? Extract<RpcSchema_All, { Request: { method: schema } }>['Request']
        : {}),
    ''
  >
>

/**
 * Extracts parameters from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
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
  schema extends RpcSchema_Generic | RpcSchema_MethodNameGeneric,
> = RpcSchema_ExtractRequest<schema>['params']

/**
 * Extracts return type from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
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
  schema extends RpcSchema_Generic | RpcSchema_MethodNameGeneric,
> = schema extends RpcSchema_Generic
  ? schema['ReturnType']
  : schema extends RpcSchema_MethodName
    ? Extract<RpcSchema_All, { Request: { method: schema } }>['ReturnType']
    : unknown

////////////////////////////////////////////////////////////////
// Define Method
////////////////////////////////////////////////////////////////

/**
 * Type to define a custom type-safe JSON-RPC Schema to be used with {@link ox#RpcRequest.(from:function)}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema, RpcRequest } from 'ox'
 *
 * type Schema = RpcSchema.Define<{
 *   Request: {
 *     method: 'eth_foobar',
 *     params: [id: number],
 *   }
 *   ReturnType: string
 * }>
 * const request = RpcRequest.from<Schema>({
 *   id: 0,
 *   method: 'eth_foobar',
 *   params: [0],
 * })
 * ```
 */
export type RpcSchema_Define<schema extends RpcSchema_Generic> = schema

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
 * type Schema = RpcSchema.Generic
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
  params = unknown,
> = {
  Request: {
    method: name
    params?: params | undefined
  }
  ReturnType?: unknown
}

/**
 * Generic type to define a JSON-RPC Method Name.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Name = RpcSchema.MethodNameGeneric
 * //   ^?
 *
 *
 *
 *
 *
 * ```
 */
export type RpcSchema_MethodNameGeneric = RpcSchema_MethodName | (string & {})

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
 * type Schema = RpcSchema.All
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
 * type MethodName = RpcSchema.MethodName
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
export type RpcSchema_MethodName =
  | RpcSchema_MethodNameEth
  | RpcSchema_MethodNameWallet
  | RpcSchema_MethodNameEip4337
