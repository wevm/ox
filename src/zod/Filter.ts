/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

const blockTag = z.union([
  /* @__PURE__ */ z.literal('latest'),
  /* @__PURE__ */ z.literal('earliest'),
  /* @__PURE__ */ z.literal('pending'),
  /* @__PURE__ */ z.literal('safe'),
  /* @__PURE__ */ z.literal('finalized'),
])

const address = z.union([
  z_Address.Address,
  /* @__PURE__ */ z.readonly(/* @__PURE__ */ z.array(z_Address.Address)),
  /* @__PURE__ */ z.null(),
])

/** Filter topic schema. */
export const Topic = z.union([
  z_Hex.Hex,
  /* @__PURE__ */ z.readonly(/* @__PURE__ */ z.array(z_Hex.Hex)),
  /* @__PURE__ */ z.null(),
])

/** Filter topics schema. */
export const Topics = z.readonly(z.array(Topic))

/** Filter schema. */
export const Filter = filter(z_Uint.Uint)

/** Encode-only filter schema accepting numberish `toRpc` inputs. */
export const FilterToRpc = filter(z_Uint.UintToRpc)

// @__NO_SIDE_EFFECTS__
function filter<uint extends z.ZodMiniType>(uint: uint) {
  const blockNumber = z.union([uint, blockTag])
  const base = {
    address: z.optional(address),
    topics: z.optional(Topics),
  }
  return z.union([
    z.object({
      ...base,
      blockHash: z_Hex.Hex,
      fromBlock: z.optional(z.undefined()),
      toBlock: z.optional(z.undefined()),
    }),
    z.object({
      ...base,
      blockHash: z.optional(z.undefined()),
      fromBlock: z.optional(blockNumber),
      toBlock: z.optional(blockNumber),
    }),
  ])
}
