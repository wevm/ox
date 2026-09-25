/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_FrameReceipt from '../core/FrameReceipt.js'
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import {
  quantityHex,
  uintBigint,
  uintBigintNumberish,
} from './internal/Integer.js'
import * as z from 'zod/mini'

const frameLog = z.object({
  address: z_Address.Address,
  blockHash: z.optional(z_Hex.Hex),
  blockNumber: z.optional(quantityHex()),
  blockTimestamp: z.optional(quantityHex()),
  data: z_Hex.Hex,
  logIndex: z.optional(quantityHex()),
  removed: z.optional(z.boolean()),
  topics: z.array(z_Hex.Hex),
  transactionHash: z.optional(z_Hex.Hex),
  transactionIndex: z.optional(quantityHex()),
})

const frameReceiptRpc = z.object({
  executionGasUsed: quantityHex(),
  gasUsed: quantityHex(),
  logs: z.readonly(z.array(frameLog)),
  stateGasUsed: quantityHex(),
  status: z.enum(['0x0', '0x1', '0x2']),
})
const frameReceiptDecoded = z.object({
  executionGasUsed: uintBigint(),
  gasUsed: uintBigint(),
  logs: z.readonly(z.array(frameLog)),
  stateGasUsed: uintBigint(),
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
    executionGasUsed: uintBigintNumberish(),
    gasUsed: uintBigintNumberish(),
    stateGasUsed: uintBigintNumberish(),
  }),
  {
    decode: core_FrameReceipt.fromRpc,
    encode: core_FrameReceipt.toRpc,
  },
)
