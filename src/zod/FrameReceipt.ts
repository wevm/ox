/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_FrameReceipt from '../core/FrameReceipt.js'
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z from 'zod/mini'

const frameLog = z.object({
  address: z_Address.Address,
  data: z_Hex.Hex,
  topics: z.array(z_Hex.Hex),
})

const frameReceiptRpc = z.object({
  executionGasUsed: z_Hex.Hex,
  logs: z.readonly(z.array(frameLog)),
  stateGasUsed: z_Hex.Hex,
  status: z.union([z.literal(0), z.literal(1), z.literal(2)]),
})
const frameReceiptDecoded = z.object({
  gasUsed: z.bigint(),
  logs: z.readonly(z.array(frameLog)),
  stateGasUsed: z.bigint(),
  status: z.enum(['reverted', 'success', 'skipped']),
})

/** Codec between RPC and decoded frame receipts. */
export const FrameReceipt = z.codec(frameReceiptRpc, frameReceiptDecoded, {
  decode: core_FrameReceipt.fromRpc,
  encode: core_FrameReceipt.toRpc,
})

/** Encode-only frame receipt codec accepting numberish gas. */
export const FrameReceiptToRpc = z.codec(
  frameReceiptRpc,
  z.extend(frameReceiptDecoded, {
    gasUsed: z.union([z_Hex.Hex, z.bigint(), z.number()]),
    stateGasUsed: z.union([z_Hex.Hex, z.bigint(), z.number()]),
  }),
  {
    decode: core_FrameReceipt.fromRpc,
    encode: core_FrameReceipt.toRpc,
  },
)
