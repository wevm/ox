/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_Hex from '../core/Hex.js'
import * as z_Address from './Address.js'
import {
  encodeNumberish,
  quantityHex,
  uintBigint,
  uintBigintNumberish,
} from './internal/Integer.js'
import * as z_Uint from './Uint.js'
import * as z_Withdrawal from './Withdrawal.js'
import * as z from 'zod/mini'

/** `prevRandao` is a 32-byte hash on the wire, decoded as `bigint`. */
const PrevRandao = z.codec(quantityHex(256), uintBigint(256), {
  decode: (value) => core_Hex.toBigInt(value),
  encode: (value) => core_Hex.fromNumber(value, { size: 32 }),
})

const PrevRandaoToRpc = z.codec(quantityHex(256), uintBigintNumberish(256), {
  decode: (value) => core_Hex.toBigInt(value),
  encode: (value) => core_Hex.padLeft(encodeNumberish(value), 32),
})

/** Block overrides schema. */
export const BlockOverrides = z.object(
  fields(z_Uint.Uint, PrevRandao, z_Withdrawal.Withdrawal),
)

/** Encode-only block overrides schema accepting numberish `toRpc` inputs. */
export const BlockOverridesToRpc = z.object(
  fields(z_Uint.UintToRpc, PrevRandaoToRpc, z_Withdrawal.WithdrawalToRpc),
)

// @__NO_SIDE_EFFECTS__
function fields<
  uint extends z.ZodMiniType,
  prevRandao extends z.ZodMiniType,
  withdrawal extends z.ZodMiniType,
>(uint: uint, prevRandao: prevRandao, withdrawal: withdrawal) {
  return {
    baseFeePerGas: z.optional(uint),
    blobBaseFee: z.optional(uint),
    feeRecipient: z.optional(z_Address.Address),
    gasLimit: z.optional(uint),
    number: z.optional(uint),
    prevRandao: z.optional(prevRandao),
    time: z.optional(uint),
    withdrawals: z.optional(z.array(withdrawal)),
  }
}
