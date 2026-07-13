/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z from 'zod/mini'

const base = {
  id: z.number(),
  jsonrpc: z.literal('2.0'),
}

/** JSON-RPC error object schema. */
export const ErrorObject = z.object({
  code: z.number(),
  message: z.string(),
  data: z.optional(z.unknown()),
})

/** JSON-RPC response schema. */
export const RpcResponse = z.union([
  z.object({
    ...base,
    result: z.unknown(),
    error: z.optional(z.undefined()),
  }),
  z.object({
    ...base,
    error: ErrorObject,
    result: z.optional(z.undefined()),
  }),
])
