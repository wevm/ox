/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z from 'zod/mini'

export const StateMutability = z.union([
  z.literal('nonpayable'),
  z.literal('payable'),
])

const Raw = z.object({
  type: z.literal('fallback'),
  payable: z.optional(z.boolean()),
  stateMutability: z.optional(StateMutability),
})

export const AbiFallback = z.pipe(
  Raw,
  z.transform((value) => ({
    ...value,
    stateMutability:
      value.stateMutability ?? (value.payable ? 'payable' : 'nonpayable'),
  })),
)
