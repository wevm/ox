/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Uint from './Uint.js'
import * as z_Withdrawal from './Withdrawal.js'
import * as z from 'zod/mini'

/** Block overrides schema. */
export const BlockOverrides = z.object({
  baseFeePerGas: z.optional(z_Uint.Uint),
  blobBaseFee: z.optional(z_Uint.Uint),
  feeRecipient: z.optional(z_Address.Address),
  gasLimit: z.optional(z_Uint.Uint),
  number: z.optional(z_Uint.Uint),
  prevRandao: z.optional(z_Uint.Uint),
  time: z.optional(z_Uint.Uint),
  withdrawals: z.optional(z.array(z_Withdrawal.Withdrawal)),
})
