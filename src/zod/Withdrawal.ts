/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Number from './Number.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

/** RPC withdrawal schema decoded to a withdrawal. */
export const Withdrawal = z.object({
  address: z_Address.Address,
  amount: z_Uint.Uint,
  index: z_Number.Number,
  validatorIndex: z_Number.Number,
})
