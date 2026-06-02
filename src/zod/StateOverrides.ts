/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

const accountOverrideBase = {
  balance: z.optional(z_Uint.Uint),
  code: z.optional(z_Hex.Hex),
  movePrecompileToAddress: z.optional(z_Address.Address),
  nonce: z.optional(z_Uint.Uint),
}

/** Account storage override schema. */
export const AccountStorage = z.record(z_Hex.Hex, z_Hex.Hex)

/** Account override schema. */
export const AccountOverrides = z.union([
  z.object({
    ...accountOverrideBase,
    state: z.optional(AccountStorage),
    stateDiff: z.optional(z.undefined()),
  }),
  z.object({
    ...accountOverrideBase,
    state: z.optional(z.undefined()),
    stateDiff: z.optional(AccountStorage),
  }),
])

/** State override set schema. */
export const StateOverrides = z.record(z_Address.Address, AccountOverrides)
