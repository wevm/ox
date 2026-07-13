import * as Errors from '../core/Errors.js'
import * as eth from './internal/rpcSchemas/Eth.js'
import { from as fromItem } from './internal/rpcSchemas/from.js'
import type { Item } from './internal/rpcSchemas/from.js'
import * as wallet from './internal/rpcSchemas/Wallet.js'
import * as z from 'zod/mini'

export type { Item } from './internal/rpcSchemas/from.js'

/**
 * Instantiates JSON-RPC method schema(s) from Zod `params`/`returns` schemas.
 *
 * Two forms are supported:
 *
 * - A single method `{ method, params, returns }`, returning a `RpcSchema.Item`.
 * - A record of `{ params, returns }` keyed by method name, returning a
 *   normalized `RpcSchema.Namespace` (each method's name is taken from its key
 *   and its `request` schema is derived). The result is usable with the
 *   `RpcSchema.decode*`/`RpcSchema.encode*` methods and as a schema for
 *   `Provider`/`RpcTransport`.
 *
 * @example
 * ### Single Method
 *
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const eth_blockNumber = z.RpcSchema.from({
 *   method: 'eth_blockNumber',
 *   params: z.optional(z.tuple([])),
 *   returns: z.Hex.Hex
 * })
 * ```
 *
 * @example
 * ### Namespace
 *
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const schema = z.RpcSchema.from({
 *   ...z.RpcSchema.Eth,
 *   abe_foo: {
 *     params: z.tuple([z.number()]),
 *     returns: z.string()
 *   }
 * })
 *
 * const params = z.RpcSchema.decodeParams(
 *   schema,
 *   'abe_foo',
 *   [123]
 * )
 * ```
 */
export function from<
  const method extends string,
  params extends z.ZodMiniType,
  returns extends z.ZodMiniType,
>(parameters: {
  method: method
  params: params
  returns: returns
}): Item<method, params, returns>
export function from<const namespace extends from.Namespace>(
  namespace: namespace,
): from.ReturnType<namespace>
// eslint-disable-next-line jsdoc-js/require-jsdoc
export function from(
  input:
    | { method?: string; params?: z.ZodMiniType; returns?: z.ZodMiniType }
    | from.Namespace,
): unknown {
  if (typeof input.method === 'string')
    return fromItem(input as Parameters<typeof fromItem>[0])
  return Object.fromEntries(
    Object.entries(input as from.Namespace).map(([method, item]) => [
      method,
      fromItem({ method, params: item.params, returns: item.returns }),
    ]),
  )
}

export declare namespace from {
  /** A record of `{ params, returns }` Zod schemas keyed by method name. */
  type Namespace = Record<
    string,
    { params: z.ZodMiniType; returns: z.ZodMiniType }
  >

  /** The normalized `RpcSchema.Namespace` derived from `from.Namespace`. */
  type ReturnType<namespace extends Namespace> = {
    [method in keyof namespace & string]: Item<
      method,
      namespace[method]['params'],
      namespace[method]['returns']
    >
  }
}

/** A namespace of JSON-RPC method schemas, keyed by method name. */
export type Namespace = Record<string, Item>

/** Extracts the method names of a `RpcSchema.Namespace`. */
export type MethodName<namespace extends Namespace> = keyof namespace & string

/** JSON-RPC method schemas for the `eth_` namespace. */
export const Eth = eth

/** JSON-RPC method schemas for the `wallet_` namespace. */
export const Wallet = wallet

/** JSON-RPC method schemas for the `eth_` and `wallet_` namespaces. */
export const Default = { ...eth, ...wallet }

const requestCache = new WeakMap<Namespace, z.ZodMiniType>()

// Builds (and caches) the discriminated-union request schema for a namespace.
function requestSchema(namespace: Namespace): z.ZodMiniType {
  const cached = requestCache.get(namespace)
  if (cached) return cached
  const schema = z.discriminatedUnion(
    'method',
    Object.values(namespace).map((item) => item.request) as never,
  )
  requestCache.set(namespace, schema)
  return schema
}

/**
 * Looks up the `RpcSchema.Item` for a method on a namespace. Resolve a method
 * once and pass the item to the `decode*`/`encode*` codecs to encode params and
 * decode returns without repeating the namespace and method name.
 *
 * @example
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const item = z.RpcSchema.parseItem(
 *   z.RpcSchema.Eth,
 *   'eth_getBlockTransactionCountByNumber'
 * )
 *
 * const params = z.RpcSchema.encodeParams(item, [1n])
 * const count = z.RpcSchema.decodeReturns(item, '0x1')
 * ```
 *
 * @throws `RpcSchema.MethodNotFoundError` if the method does not exist.
 */
export function parseItem<
  const namespace extends Namespace,
  method extends MethodName<namespace>,
>(namespace: namespace, method: method): namespace[method] {
  const item = namespace[method]
  if (!item) throw new MethodNotFoundError({ method })
  return item
}

// Resolves a codec function's arguments into `[item, value]`, accepting either
// `(item, value)` or `(namespace, method, value)`.
function resolveItem(args: readonly unknown[]): [item: Item, value: unknown] {
  if (args.length === 2) return [args[0] as Item, args[1]]
  return [parseItem(args[0] as Namespace, args[1] as string), args[2]]
}

/**
 * Decodes (wire → native) the `params` for a method. Use on the receiving side
 * (e.g. a server) to coerce incoming wire params into their native
 * representation. Accepts either a namespace + method name, or a resolved
 * `RpcSchema.Item` (from `parseItem`/`from`).
 *
 * @example
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const params = z.RpcSchema.decodeParams(
 *   z.RpcSchema.Eth,
 *   'eth_getBlockByNumber',
 *   ['0x1', true]
 * )
 * ```
 *
 * @example
 * ### From a Resolved Item
 *
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const item = z.RpcSchema.parseItem(
 *   z.RpcSchema.Eth,
 *   'eth_getBlockByNumber'
 * )
 *
 * const params = z.RpcSchema.decodeParams(item, ['0x1', true])
 * ```
 *
 * @throws `RpcSchema.MethodNotFoundError` if the method does not exist.
 */
export function decodeParams<const item extends Item>(
  item: item,
  params: z.input<item['params']>,
): z.output<item['params']>
export function decodeParams<
  const namespace extends Namespace,
  method extends MethodName<namespace>,
>(
  namespace: namespace,
  method: method,
  params: z.input<namespace[method]['params']>,
): z.output<namespace[method]['params']>
// eslint-disable-next-line jsdoc-js/require-jsdoc
export function decodeParams(...args: readonly unknown[]): unknown {
  const [item, params] = resolveItem(args)
  return z.decode(item.params, params as never) as never
}

/**
 * Encodes (native → wire) the `params` for a method. Use on the sending side
 * (e.g. a client) to serialize native params into the wire shape a JSON-RPC
 * endpoint expects. Accepts either a namespace + method name, or a resolved
 * `RpcSchema.Item` (from `parseItem`/`from`).
 *
 * @example
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const params = z.RpcSchema.encodeParams(
 *   z.RpcSchema.Eth,
 *   'eth_getBlockByNumber',
 *   [1n, true]
 * )
 * ```
 *
 * @example
 * ### From a Resolved Item
 *
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const item = z.RpcSchema.parseItem(
 *   z.RpcSchema.Eth,
 *   'eth_getBlockByNumber'
 * )
 *
 * const params = z.RpcSchema.encodeParams(item, [1n, true])
 * ```
 *
 * @throws `RpcSchema.MethodNotFoundError` if the method does not exist.
 */
export function encodeParams<const item extends Item>(
  item: item,
  params: z.output<item['params']>,
): z.input<item['params']>
export function encodeParams<
  const namespace extends Namespace,
  method extends MethodName<namespace>,
>(
  namespace: namespace,
  method: method,
  params: z.output<namespace[method]['params']>,
): z.input<namespace[method]['params']>
// eslint-disable-next-line jsdoc-js/require-jsdoc
export function encodeParams(...args: readonly unknown[]): unknown {
  const [item, params] = resolveItem(args)
  return z.encode(item.params, params as never) as never
}

/**
 * Decodes (wire → native) the `returns` value for a method. Use on the
 * receiving side (e.g. a client) to coerce a wire result into its native
 * representation. Accepts either a namespace + method name, or a resolved
 * `RpcSchema.Item` (from `parseItem`/`from`).
 *
 * @example
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const result = z.RpcSchema.decodeReturns(
 *   z.RpcSchema.Eth,
 *   'eth_blockNumber',
 *   '0x1b4'
 * )
 * ```
 *
 * @example
 * ### From a Resolved Item
 *
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const item = z.RpcSchema.parseItem(
 *   z.RpcSchema.Eth,
 *   'eth_blockNumber'
 * )
 *
 * const result = z.RpcSchema.decodeReturns(item, '0x1b4')
 * ```
 *
 * @throws `RpcSchema.MethodNotFoundError` if the method does not exist.
 */
export function decodeReturns<const item extends Item>(
  item: item,
  returns: z.input<item['returns']>,
): z.output<item['returns']>
export function decodeReturns<
  const namespace extends Namespace,
  method extends MethodName<namespace>,
>(
  namespace: namespace,
  method: method,
  returns: z.input<namespace[method]['returns']>,
): z.output<namespace[method]['returns']>
// eslint-disable-next-line jsdoc-js/require-jsdoc
export function decodeReturns(...args: readonly unknown[]): unknown {
  const [item, returns] = resolveItem(args)
  return z.decode(item.returns, returns as never) as never
}

/**
 * Encodes (native → wire) the `returns` value for a method. Use on the sending
 * side (e.g. a server) to serialize a native result into the wire shape.
 * Accepts either a namespace + method name, or a resolved `RpcSchema.Item`
 * (from `parseItem`/`from`).
 *
 * @example
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const result = z.RpcSchema.encodeReturns(
 *   z.RpcSchema.Eth,
 *   'eth_blockNumber',
 *   436n
 * )
 * ```
 *
 * @example
 * ### From a Resolved Item
 *
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const item = z.RpcSchema.parseItem(
 *   z.RpcSchema.Eth,
 *   'eth_blockNumber'
 * )
 *
 * const result = z.RpcSchema.encodeReturns(item, 436n)
 * ```
 *
 * @throws `RpcSchema.MethodNotFoundError` if the method does not exist.
 */
export function encodeReturns<const item extends Item>(
  item: item,
  returns: z.output<item['returns']>,
): z.input<item['returns']>
export function encodeReturns<
  const namespace extends Namespace,
  method extends MethodName<namespace>,
>(
  namespace: namespace,
  method: method,
  returns: z.output<namespace[method]['returns']>,
): z.input<namespace[method]['returns']>
// eslint-disable-next-line jsdoc-js/require-jsdoc
export function encodeReturns(...args: readonly unknown[]): unknown {
  const [item, returns] = resolveItem(args)
  return z.encode(item.returns, returns as never) as never
}

/**
 * Decodes (wire → native) a full JSON-RPC request (`{ method, params }`)
 * against a namespace, dispatching on `method`.
 *
 * @example
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const request = z.RpcSchema.decodeRequest(z.RpcSchema.Eth, {
 *   method: 'eth_getBlockByNumber',
 *   params: ['0x1', true]
 * })
 * ```
 */
export function decodeRequest<const namespace extends Namespace>(
  namespace: namespace,
  request: RequestInput<namespace>,
): RequestOutput<namespace> {
  return z.decode(requestSchema(namespace), request as never) as never
}

/**
 * Encodes (native → wire) a full JSON-RPC request (`{ method, params }`)
 * against a namespace, dispatching on `method`.
 *
 * @example
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const request = z.RpcSchema.encodeRequest(z.RpcSchema.Eth, {
 *   method: 'eth_getBlockByNumber',
 *   params: [1n, true]
 * })
 * ```
 */
export function encodeRequest<const namespace extends Namespace>(
  namespace: namespace,
  request: RequestOutput<namespace>,
): RequestInput<namespace> {
  return z.encode(requestSchema(namespace), request as never) as never
}

/**
 * Alias for `RpcSchema.decodeRequest`.
 *
 * @example
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const request = z.RpcSchema.parse(z.RpcSchema.Eth, {
 *   method: 'eth_getBalance',
 *   params: [
 *     '0x0000000000000000000000000000000000000000',
 *     'latest'
 *   ]
 * })
 * ```
 */
export const parse = decodeRequest

/** Wire (input) request envelope for a namespace. */
export type RequestInput<namespace extends Namespace> = {
  [method in MethodName<namespace>]: {
    method: namespace[method]['method']
    params: z.input<namespace[method]['params']>
  }
}[MethodName<namespace>]

/** Decoded (output) request envelope for a namespace. */
export type RequestOutput<namespace extends Namespace> = {
  [method in MethodName<namespace>]: {
    method: namespace[method]['method']
    params: z.output<namespace[method]['params']>
  }
}[MethodName<namespace>]

/** Thrown when a method does not exist on a namespace. */
export class MethodNotFoundError extends Errors.BaseError {
  override readonly name = 'RpcSchema.MethodNotFoundError'

  constructor({ method }: { method: string }) {
    super(`Method \`${method}\` does not exist on the schema.`)
  }
}
