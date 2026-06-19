/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Uint from './Uint.js'
import * as z_Withdrawal from './Withdrawal.js'
import * as z from 'zod/mini'

/** Block overrides schema. */
export const BlockOverrides = z.object(
  fields(z_Uint.Uint, z_Withdrawal.Withdrawal),
)

/** Encode-only block overrides schema accepting numberish `toRpc` inputs. */
export const BlockOverridesToRpc = z.object(
  fields(z_Uint.UintToRpc, z_Withdrawal.WithdrawalToRpc),
)

function fields<uint extends z.ZodMiniType, withdrawal extends z.ZodMiniType>(
  uint: uint,
  withdrawal: withdrawal,
) {
  return {
    baseFeePerGas: z.optional(uint),
    blobBaseFee: z.optional(uint),
    feeRecipient: z.optional(z_Address.Address),
    gasLimit: z.optional(uint),
    number: z.optional(uint),
    prevRandao: z.optional(uint),
    time: z.optional(uint),
    withdrawals: z.optional(z.array(withdrawal)),
  }
}
