/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

/** Account storage override schema. */
export const AccountStorage = z.record(z_Hex.Hex, z_Hex.Hex)

/** Account override schema. */
export const AccountOverrides = accountOverrides(z_Uint.Uint)

/** Encode-only account override schema accepting numberish `toRpc` inputs. */
export const AccountOverridesToRpc = accountOverrides(z_Uint.UintToRpc)

/** State override set schema. */
export const StateOverrides = z.record(z_Address.Address, AccountOverrides)

/** Encode-only state override set schema accepting numberish `toRpc` inputs. */
export const StateOverridesToRpc = z.record(
  z_Address.Address,
  AccountOverridesToRpc,
)

function accountOverrides<uint extends z.ZodMiniType>(uint: uint) {
  const base = {
    balance: z.optional(uint),
    code: z.optional(z_Hex.Hex),
    movePrecompileToAddress: z.optional(z_Address.Address),
    nonce: z.optional(uint),
  }
  return z.union([
    z.object({
      ...base,
      state: z.optional(AccountStorage),
      stateDiff: z.optional(z.undefined()),
    }),
    z.object({
      ...base,
      state: z.optional(z.undefined()),
      stateDiff: z.optional(AccountStorage),
    }),
  ])
}
