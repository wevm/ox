/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AbiParameter from './AbiParameter.js'
import * as z_Solidity from './Solidity.js'
import * as z from 'zod/mini'

export const AbiEvent = z.object({
  type: z.literal('event'),
  anonymous: z.optional(z.boolean()),
  inputs: z.readonly(z.array(z_AbiParameter.AbiEventParameter)),
  name: z_Solidity.Identifier,
})
