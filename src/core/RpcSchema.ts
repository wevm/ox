import type * as z from 'zod/mini'
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
 *         method: 'abe_foo'
 *         params: [id: number]
 *       }
 *       ReturnType: string
 *     }
 *   | {
 *       Request: {
 *         method: 'abe_bar'
 *         params: [id: string]
 *       }
 *       ReturnType: string
 *     }
 * >()
 *
 * const provider = Provider.from(window.ethereum, { schema })
 *
 * const blockNumber = await provider.request({ method: 'e' })
 * //                                                    ^|
 * ```
 */
export function from<schema extends Generic>(): schema {
  return null as never
}

/**
 * Extracts a schema item from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Item = RpcSchema.ExtractItem<
 *   RpcSchema.Eth,
 *   'eth_getBlockByNumber'
 * >
 * const item = null as unknown as Item
 * //    ^?
 * ```
 */
export type ExtractItem<
  schema extends Generic,
  methodName extends MethodNameGeneric<schema> = MethodNameGeneric<schema>,
> = Compute<{
  Request: ExtractRequest<schema, methodName>
  ReturnType: ExtractReturnType<schema, methodName>
}>

/**
 * Extracts request from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Request = RpcSchema.ExtractRequest<
 *   RpcSchema.Eth,
 *   'eth_getBlockByNumber'
 * >
 * const request = null as unknown as Request
 * //    ^?
 * ```
 */
export type ExtractRequest<
  schema extends Generic,
  methodName extends MethodNameGeneric<schema> = MethodNameGeneric<schema>,
> = Extract<schema['Request'], { method: methodName }>

/**
 * Type-safe union of all JSON-RPC Method Names.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type MethodName =
 *   RpcSchema.ExtractMethodName<RpcSchema.Default>
 * //   ^?
 * ```
 */
export type ExtractMethodName<schema extends Generic> =
  schema['Request']['method']

/**
 * Extracts parameters from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Eth_GetBlockByNumber = RpcSchema.ExtractParams<
 *   RpcSchema.Eth,
 *   'eth_getBlockByNumber'
 * >
 * const parameters = null as unknown as Eth_GetBlockByNumber
 * //    ^?
 * ```
 */
export type ExtractParams<
  schema extends Generic,
  methodName extends MethodNameGeneric<schema> = MethodNameGeneric<schema>,
> = ExtractRequest<schema, methodName>['params']

/**
 * Extracts return type from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type ReturnType = RpcSchema.ExtractReturnType<
 *   RpcSchema.Eth,
 *   'eth_getBlockByNumber'
 * >
 * const returnType = null as unknown as ReturnType
 * //    ^?
 * ```
 */
export type ExtractReturnType<
  schema extends Generic,
  methodName extends MethodNameGeneric<schema> = MethodNameGeneric<schema>,
> = methodName extends schema['Request']['method']
  ? IsNarrowable<schema, Generic> extends true
    ? Extract<schema, { Request: { method: methodName } }>['ReturnType']
    : unknown
  : unknown

/**
 * Type to define a custom type-safe JSON-RPC Schema.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema, RpcRequest } from 'ox'
 *
 * type Schema = RpcSchema.From<{
 *   Request: {
 *     method: 'eth_foobar'
 *     params: [id: number]
 *   }
 *   ReturnType: string
 * }>
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
 * ```
 */
export type MethodNameGeneric<schema extends Generic = Generic> =
  | schema['Request']['method']
  | (string & {})

/**
 * Converts an Ox {@link ox#RpcSchema.Generic} (union of `{ Request, ReturnType }`) to
 * a [Viem-compatible RPC schema](https://viem.sh) (tuple of `{ Method, Parameters, ReturnType }`).
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type ViemSchema = RpcSchema.ToViem<
 *   | {
 *       Request: {
 *         method: 'eth_blockNumber'
 *         params?: undefined
 *       }
 *       ReturnType: `0x${string}`
 *     }
 *   | {
 *       Request: { method: 'eth_chainId'; params?: undefined }
 *       ReturnType: `0x${string}`
 *     }
 * >
 * ```
 */
export type ToViem<schema extends Generic> = UnionToTuple<
  schema extends schema
    ? {
        Method: schema['Request']['method']
        Parameters: schema['Request']['params']
        ReturnType: schema extends { ReturnType: infer r } ? r : unknown
      }
    : never
>

/**
 * Converts a [Viem-compatible RPC schema](https://viem.sh) (tuple of `{ Method, Parameters, ReturnType }`)
 * to an Ox {@link ox#RpcSchema.Generic} (union of `{ Request, ReturnType }`).
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type OxSchema = RpcSchema.FromViem<
 *   [
 *     {
 *       Method: 'eth_blockNumber'
 *       Parameters?: undefined
 *       ReturnType: `0x${string}`
 *     },
 *     {
 *       Method: 'eth_chainId'
 *       Parameters?: undefined
 *       ReturnType: `0x${string}`
 *     }
 *   ]
 * >
 * ```
 */
export type FromViem<schema extends readonly ViemSchemaItem[]> = {
  [k in keyof schema]: schema[k] extends ViemSchemaItem
    ? {
        Request: {
          method: schema[k]['Method']
          params: schema[k]['Parameters']
        }
        ReturnType: schema[k]['ReturnType']
      }
    : never
}[number]

/**
 * Converts a record of Zod `params`/`returns` schemas (keyed by method name) to
 * an Ox {@link ox#RpcSchema.Generic} (union of `{ Request, ReturnType }`).
 *
 * Each method's name comes from its key. Both `params` and `ReturnType` are
 * derived from the Zod schema's input (wire) type, since raw JSON-RPC clients
 * send and receive wire values. Decode wire results to their native
 * representation explicitly via `zod.RpcSchema.decodeReturns`.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 * import { z } from 'ox/zod'
 *
 * type Schema = RpcSchema.FromZod<typeof z.RpcSchema.Eth>
 * //   ^?
 * ```
 */
export type FromZod<namespace extends FromZod.Namespace> = {
  [method in keyof namespace & string]: Compute<{
    Request: {
      method: method
      params: z.input<namespace[method]['params']>
    }
    ReturnType: z.input<namespace[method]['returns']>
  }>
}[keyof namespace & string]

export declare namespace FromZod {
  /** A single method schema: Zod `params`/`returns`, keyed by method name. */
  type Item = {
    params: z.ZodMiniType
    returns: z.ZodMiniType
  }

  /** A record of Zod method schemas keyed by method name. */
  type Namespace = Record<string, Item>
}

/**
 * Schema input accepted by APIs that statically type JSON-RPC requests
 * (e.g. {@link ox#Provider.(from:function)}, {@link ox#RpcTransport.(fromHttp:function)}):
 * either an Ox {@link ox#RpcSchema.Generic} or a record of Zod `params`/`returns`
 * schemas (keyed by method name) from `ox/zod`.
 */
export type Schema = Generic | FromZod.Namespace

/**
 * Resolves a {@link ox#RpcSchema.Schema} input to an Ox {@link ox#RpcSchema.Generic}.
 * A Zod namespace is converted via {@link ox#RpcSchema.(FromZod:type)}; a `Generic` is
 * passed through; otherwise falls back to {@link ox#RpcSchema.Default}.
 */
export type ToGeneric<schema extends Schema | undefined> =
  schema extends FromZod.Namespace
    ? FromZod<schema>
    : schema extends Generic
      ? schema
      : Default

/** @internal */
type ViemSchemaItem = {
  Method: string
  Parameters?: unknown
  ReturnType?: unknown
}

// --- Union-to-tuple helpers (order is not guaranteed, but stable) ---
/** @internal */
type UnionToIntersection<union> = (
  union extends unknown ? (arg: () => union) => void : never
) extends (arg: infer intersection) => void
  ? intersection
  : never

/** @internal */
type UnionLast<union> =
  UnionToIntersection<union> extends () => infer last ? last : never

/** @internal */
type UnionToTuple<union, last = UnionLast<union>> = [union] extends [never]
  ? []
  : [...UnionToTuple<Exclude<union, last>>, last]
