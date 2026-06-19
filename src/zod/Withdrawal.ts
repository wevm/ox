/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Number from './Number.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

/** RPC withdrawal schema decoded to a withdrawal. */
export const Withdrawal = z.object(fields(z_Uint.Uint, z_Number.Number))

/** Encode-only withdrawal schema accepting numberish `toRpc` inputs. */
export const WithdrawalToRpc = z.object(
  fields(z_Uint.UintToRpc, z_Number.NumberToRpc),
)

function fields<uint extends z.ZodMiniType, num extends z.ZodMiniType>(
  uint: uint,
  num: num,
) {
  return {
    address: z_Address.Address,
    amount: uint,
    index: num,
    validatorIndex: num,
  }
}
