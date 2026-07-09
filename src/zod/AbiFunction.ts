/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AbiParameter from './AbiParameter.js'
import * as z_Solidity from './Solidity.js'
import * as z from 'zod/mini'

export const StateMutability = z.union([
  z.literal('pure'),
  z.literal('view'),
  z.literal('nonpayable'),
  z.literal('payable'),
])

const Raw = z.object({
  type: z.literal('function'),
  constant: z.optional(z.boolean()),
  gas: z.optional(z.number()),
  inputs: z.readonly(z.array(z_AbiParameter.AbiParameter)),
  name: z_Solidity.Identifier,
  outputs: z.readonly(z.array(z_AbiParameter.AbiParameter)),
  payable: z.optional(z.boolean()),
  stateMutability: z.optional(StateMutability),
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
