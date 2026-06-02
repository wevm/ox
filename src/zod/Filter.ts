/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

const blockTag = z.union([
  z.literal('latest'),
  z.literal('earliest'),
  z.literal('pending'),
  z.literal('safe'),
  z.literal('finalized'),
])

const blockNumber = z.union([z_Uint.Uint, blockTag])

const address = z.union([
  z_Address.Address,
  z.readonly(z.array(z_Address.Address)),
  z.null(),
])

/** Filter topic schema. */
export const Topic = z.union([
  z_Hex.Hex,
  z.readonly(z.array(z_Hex.Hex)),
  z.null(),
])

/** Filter topics schema. */
export const Topics = z.readonly(z.array(Topic))

const base = {
  address: z.optional(address),
  topics: z.optional(Topics),
}

/** Filter schema. */
export const Filter = z.union([
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
