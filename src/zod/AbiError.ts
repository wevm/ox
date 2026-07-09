/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AbiParameter from './AbiParameter.js'
import * as z from 'zod/mini'

export const AbiError = z.object({
  type: z.literal('error'),
  inputs: z.readonly(z.array(z_AbiParameter.AbiParameter)),
  name: z.string(),
})
