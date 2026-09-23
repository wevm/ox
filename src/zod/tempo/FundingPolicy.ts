import * as z from 'zod/mini'
import * as core_FundingPolicy from '../../tempo/FundingPolicy.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import { uintBigintNumberish } from '../internal/Integer.js'
import * as z_FundingRequirement from './FundingRequirement.js'

/** Funding permissions keyed by output token. */
export const Rules = z
  .object({
    maxSlippageBps: z.number(),
    sources: z.record(
      z_Address.Address,
      z.readonly(z.array(z_FundingRequirement.Source)),
    ),
  })
  .check(
    z.refine((value) => {
      try {
        core_FundingPolicy.toRoutes(value)
        return true
      } catch {
        return false
      }
    }, 'Invalid funding policy rules'),
  )

/** Inline funding policy creation schema. */
export const Inline = z
  .object({ admins: z.readonly(z.array(z_Address.Address)), rules: Rules })
  .check(
    z.refine((value) => {
      try {
        core_FundingPolicy.toTuple(value)
        return true
      } catch {
        return false
      }
    }, 'Invalid inline policy'),
  )

/** Domain policy authorization schema. */
export const Authorization = z.union([
  z.bigint().check(z.minimum(1n), z.maximum(2n ** 64n - 1n)),
  Inline,
])
/** RPC policy authorization schema. */
export const Rpc = z.union([z_Hex.Hex, Inline])
/** Encode-only policy authorization schema. */
export const AuthorizationToRpc = z.union([uintBigintNumberish(), Inline])
