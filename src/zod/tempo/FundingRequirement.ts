import * as z from 'zod/mini'
import * as core_FundingRequirement from '../../tempo/FundingRequirement.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import {
  uintBigintNumberish,
  uintNumberNumberish,
} from '../internal/Integer.js'

/** Concrete funding source schema. */
export const Source = z.object({ target: z_Address.Address, data: z_Hex.Hex })

/** RPC funding requirement schema. */
export const Rpc = z.object({
  token: z_Address.Address,
  amount: z_Hex.Hex,
  policyRules: z.optional(z_Hex.Hex),
  slippageBps: z.optional(z_Hex.Hex),
  sources: z.readonly(z.array(Source)),
})

/** Domain funding requirement schema. */
export const Domain = z
  .object({
    token: z_Address.Address,
    amount: z.bigint(),
    policyRules: z.optional(z_Hex.Hex),
    slippageBps: z.optional(z.number()),
    sources: z.readonly(z.array(Source)),
  })
  .check(
    z.refine((value) => {
      try {
        core_FundingRequirement.assert(value)
        return true
      } catch {
        return false
      }
    }, 'Invalid funding requirement'),
  )

/** Encode-only domain schema accepting numberish quantities. */
export const DomainToRpc = z.object({
  token: z_Address.Address,
  amount: uintBigintNumberish(),
  policyRules: z.optional(z_Hex.Hex),
  slippageBps: z.optional(uintNumberNumberish()),
  sources: z.readonly(z.array(Source)),
})

/** RPC funding requirement codec. */
export const FundingRequirement = z.codec(Rpc, Domain, {
  decode: core_FundingRequirement.fromRpc,
  encode: core_FundingRequirement.toRpc,
})

/** Encode-only funding codec accepting numberish quantities. */
export const FundingRequirementToRpc = z.codec(Rpc, DomainToRpc, {
  decode: core_FundingRequirement.fromRpc,
  encode: core_FundingRequirement.toRpc,
})
