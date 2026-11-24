/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z from 'zod/mini'

const base = {
  id: /* @__PURE__ */ z.number(),
  jsonrpc: /* @__PURE__ */ z.literal('2.0'),
}

/** JSON-RPC error object schema. */
export const ErrorObject = z.object({
  code: /* @__PURE__ */ z.number(),
  message: /* @__PURE__ */ z.string(),
  data: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.unknown()),
})

/** JSON-RPC response schema. */
export const RpcResponse = z.union([
  /* @__PURE__ */ z.object({
    ...base,
    result: /* @__PURE__ */ z.unknown(),
    error: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.undefined()),
  }),
  /* @__PURE__ */ z.object({
    ...base,
    error: ErrorObject,
    result: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.undefined()),
  }),
])
