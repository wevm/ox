/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Number from './Number.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

const topics = z.tuple([z_Hex.Hex], z_Hex.Hex)

/** Log schema. */
export const Log = z.object({
  address: z_Address.Address,
  blockHash: z_Hex.Hex,
  blockNumber: z_Uint.Uint,
  blockTimestamp: z.optional(z_Uint.Uint),
  data: z_Hex.Hex,
  logIndex: z_Number.Number,
  topics,
  transactionHash: z_Hex.Hex,
  transactionIndex: z_Number.Number,
  removed: z.boolean(),
})

/** Pending log schema. */
export const Pending = z.object({
  address: z_Address.Address,
  blockHash: z.null(),
  blockNumber: z.null(),
  blockTimestamp: z.optional(z.null()),
  data: z_Hex.Hex,
  logIndex: z.null(),
  topics,
  transactionHash: z.null(),
  transactionIndex: z.null(),
  removed: z.boolean(),
})
