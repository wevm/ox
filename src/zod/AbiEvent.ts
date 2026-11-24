/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AbiParameter from './AbiParameter.js'
import * as z_Solidity from './Solidity.js'
import * as z from 'zod/mini'

export const AbiEvent = z.object({
  type: /* @__PURE__ */ z.literal('event'),
  anonymous: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.boolean()),
  inputs: /* @__PURE__ */ z.readonly(
    /* @__PURE__ */ z.array(z_AbiParameter.AbiEventParameter),
  ),
  name: z_Solidity.Identifier,
})
