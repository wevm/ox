/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Number from './Number.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

const topics = z.array(z_Hex.Hex)

/** Log schema. */
export const Log = z.object(fields(z_Uint.Uint, z_Number.Number))

/** Encode-only log schema accepting numberish `toRpc` inputs. */
export const LogToRpc = z.object(fields(z_Uint.UintToRpc, z_Number.NumberToRpc))

/** Pending log schema. */
export const Pending = z.object({
  address: z_Address.Address,
  blockHash: /* @__PURE__ */ z.null(),
  blockNumber: /* @__PURE__ */ z.null(),
  blockTimestamp: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.null()),
  data: z_Hex.Hex,
  logIndex: /* @__PURE__ */ z.null(),
  topics,
  transactionHash: /* @__PURE__ */ z.null(),
  transactionIndex: /* @__PURE__ */ z.null(),
  removed: /* @__PURE__ */ z.boolean(),
})

// @__NO_SIDE_EFFECTS__
function fields<uint extends z.ZodMiniType, num extends z.ZodMiniType>(
  uint: uint,
  num: num,
) {
  return {
    address: z_Address.Address,
    blockHash: z_Hex.Hex,
    blockNumber: uint,
    blockTimestamp: z.optional(uint),
    data: z_Hex.Hex,
    logIndex: num,
    topics,
    transactionHash: z_Hex.Hex,
    transactionIndex: num,
    removed: z.boolean(),
  }
}
