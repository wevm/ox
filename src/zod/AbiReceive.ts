/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z from 'zod/mini'

export const AbiReceive = z.object({
  type: z.literal('receive'),
  stateMutability: z.literal('payable'),
})
