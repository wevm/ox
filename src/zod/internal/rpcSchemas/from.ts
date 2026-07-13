/* eslint-disable jsdoc-js/require-example */
import * as z from 'zod/mini'

/**
 * A single JSON-RPC method schema. Holds the Zod schemas for a method's
 * `params` and `returns`, plus a derived `request` (`{ method, params }`)
 * schema used to build discriminated-union request envelopes.
 */
export type Item<
  method extends string = string,
  params extends z.ZodMiniType = z.ZodMiniType,
  returns extends z.ZodMiniType = z.ZodMiniType,
> = {
  method: method
  params: params
  request: z.ZodMiniType
  returns: returns
}

/**
 * Instantiates a JSON-RPC method schema from a `params` and `returns` Zod
 * schema. The returned `RpcSchema.Item` also exposes a derived
 * `request` schema (`{ method, params }`) for envelope validation.
 *
 * @example
 * ```ts twoslash
 * import { z } from 'ox/zod'
 *
 * const eth_blockNumber = z.RpcSchema.from({
 *   method: 'eth_blockNumber',
 *   params: z.optional(z.tuple([])),
 *   returns: z.Hex.Hex
 * })
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
}): Item<method, params, returns> {
  const { method, params, returns } = parameters
  return {
    method,
    params,
    request: z.object({ method: z.literal(method), params }),
    returns,
  }
}
