import type { ResolvedRegister } from './internal/register.js'
import type { Compute, IsNarrowable } from './internal/types.js'

export type { Eth } from './internal/rpcSchemas/eth.js'
export type { Wallet } from './internal/rpcSchemas/wallet.js'

/**
 * Instantiates a statically typed Schema. This is a runtime-noop function, and is purposed
 * to be used as a type-level tag to be used with {@link ox#Provider.(from:function)} or
 * {@link ox#RpcTransport.(fromHttp:function)}.
 *
 * @example
 * ### Using with `Provider.from`
 *
 * ```ts twoslash
 * // @noErrors
 * import 'ox/window'
 * import { Provider, RpcSchema } from 'ox'
 *
 * const schema = RpcSchema.from<
 *   | RpcSchema.Default
 *   | {
 *       Request: {
 *         method: 'abe_foo',
 *         params: [id: number],
 *       }
 *       ReturnType: string
 *     }
 *   | {
 *       Request: {
 *         method: 'abe_bar',
 *         params: [id: string],
 *       }
 *       ReturnType: string
 *     }
 * >()
 *
 * const provider = Provider.from(window.ethereum, { schema })
 *
 * const blockNumber = await provider.request({ method: 'e' })
 * //                                                    ^|
 *
 *
 *
 *
 *
 * ```
 */
export function from<schema extends Generic>(): schema {
  return null as never
}

/**
 * Extracts a method from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Eth_GetBlockByNumber = RpcSchema.ExtractMethod<'eth_getBlockByNumber'>
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
export type ExtractMethod<schema extends Generic | MethodNameGeneric> =
  Compute<{
    Request: ExtractRequest<schema>
    ReturnType: ExtractReturnType<schema>
  }>

/**
 * Extracts request from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Eth_GetBlockByNumber = RpcSchema.ExtractRequest<'eth_getBlockByNumber'>
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
// TODO: clean
export type ExtractRequest<
  schemaOrMethodName extends Generic | MethodNameGeneric,
  schema extends Generic = Default,
> = Compute<
  Omit<
    {
      method: schemaOrMethodName extends Generic
        ? schemaOrMethodName['Request']['method']
        : schemaOrMethodName | MethodName
      params?: unknown
    } & (schemaOrMethodName extends Generic
      ? schemaOrMethodName['Request']
      : IsNarrowable<schemaOrMethodName, MethodName> extends true
        ? Extract<
            schema,
            { Request: { method: schemaOrMethodName } }
          >['Request']
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
export type ExtractParams<schema extends Generic | MethodNameGeneric> =
  ExtractRequest<schema>['params']

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
export type ExtractReturnType<
  schemaOrMethodName extends Generic | MethodNameGeneric,
  schema extends Generic = Default,
> = schemaOrMethodName extends Generic
  ? schemaOrMethodName['ReturnType']
  : schemaOrMethodName extends MethodName
    ? Extract<schema, { Request: { method: schemaOrMethodName } }>['ReturnType']
    : unknown

/**
 * Type to define a custom type-safe JSON-RPC Schema to be used with {@link ox#RpcRequest.(from:function)}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema, RpcRequest } from 'ox'
 *
 * type Schema = RpcSchema.From<{
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
export type From<schema extends Generic> = schema

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
export type Generic<name extends string = string, params = unknown> = {
  Request: {
    method: name
    params?: params | undefined
  }
  ReturnType?: unknown
}

/**
 * Type-safe union of all JSON-RPC Methods.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Schema = RpcSchema.Default
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
export type Default = ResolvedRegister['RpcSchema']

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
export type MethodNameGeneric = MethodName | (string & {})

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
export type MethodName = Default['Request']['method']
