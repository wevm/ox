/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z from 'zod/mini'

export const AbiReceive = z.object({
  type: /* @__PURE__ */ z.literal('receive'),
  stateMutability: /* @__PURE__ */ z.literal('payable'),
})
