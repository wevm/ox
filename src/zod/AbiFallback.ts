/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z from 'zod/mini'

export const StateMutability = z.union([
  /* @__PURE__ */ z.literal('nonpayable'),
  /* @__PURE__ */ z.literal('payable'),
])

const Raw = z.object({
  type: /* @__PURE__ */ z.literal('fallback'),
  payable: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.boolean()),
  stateMutability: /* @__PURE__ */ z.optional(StateMutability),
})

export const AbiFallback = z.pipe(
  Raw,
  z.transform((value) => ({
    ...value,
    stateMutability:
      value.stateMutability ?? (value.payable ? 'payable' : 'nonpayable'),
  })),
)
