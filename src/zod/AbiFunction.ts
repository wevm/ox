/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AbiParameter from './AbiParameter.js'
import * as z_Solidity from './Solidity.js'
import * as z from 'zod/mini'

export const StateMutability = z.union([
  /* @__PURE__ */ z.literal('pure'),
  /* @__PURE__ */ z.literal('view'),
  /* @__PURE__ */ z.literal('nonpayable'),
  /* @__PURE__ */ z.literal('payable'),
])

const Raw = z.object({
  type: /* @__PURE__ */ z.literal('function'),
  constant: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.boolean()),
  gas: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.number()),
  inputs: /* @__PURE__ */ z.readonly(
    /* @__PURE__ */ z.array(z_AbiParameter.AbiParameter),
  ),
  name: z_Solidity.Identifier,
  outputs: /* @__PURE__ */ z.readonly(
    /* @__PURE__ */ z.array(z_AbiParameter.AbiParameter),
  ),
  payable: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.boolean()),
  stateMutability: /* @__PURE__ */ z.optional(StateMutability),
})

export const AbiFunction = z.pipe(
  Raw,
  z.transform((value) => ({
    ...value,
    stateMutability:
      value.stateMutability ??
      (value.constant ? 'view' : value.payable ? 'payable' : 'nonpayable'),
  })),
)
