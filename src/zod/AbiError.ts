/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AbiParameter from './AbiParameter.js'
import * as z from 'zod/mini'

export const AbiError = z.object({
  type: /* @__PURE__ */ z.literal('error'),
  inputs: /* @__PURE__ */ z.readonly(
    /* @__PURE__ */ z.array(z_AbiParameter.AbiParameter),
  ),
  name: /* @__PURE__ */ z.string(),
})
