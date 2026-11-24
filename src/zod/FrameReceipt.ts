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
  blockHash: /* @__PURE__ */ z.optional(z_Hex.Hex),
  blockNumber: /* @__PURE__ */ z.optional(/* @__PURE__ */ quantityHex()),
  blockTimestamp: /* @__PURE__ */ z.optional(/* @__PURE__ */ quantityHex()),
  data: z_Hex.Hex,
  logIndex: /* @__PURE__ */ z.optional(/* @__PURE__ */ quantityHex()),
  removed: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.boolean()),
  topics: /* @__PURE__ */ z.array(z_Hex.Hex),
  transactionHash: /* @__PURE__ */ z.optional(z_Hex.Hex),
  transactionIndex: /* @__PURE__ */ z.optional(/* @__PURE__ */ quantityHex()),
})

const frameReceiptRpc = z.object({
  executionGasUsed: /* @__PURE__ */ quantityHex(),
  gasUsed: /* @__PURE__ */ quantityHex(),
  logs: /* @__PURE__ */ z.readonly(/* @__PURE__ */ z.array(frameLog)),
  stateGasUsed: /* @__PURE__ */ quantityHex(),
  status: /* @__PURE__ */ z.enum(['0x0', '0x1', '0x2']),
})
const frameReceiptDecoded = z.object({
  executionGasUsed: /* @__PURE__ */ uintBigint(),
  gasUsed: /* @__PURE__ */ uintBigint(),
  logs: /* @__PURE__ */ z.readonly(/* @__PURE__ */ z.array(frameLog)),
  stateGasUsed: /* @__PURE__ */ uintBigint(),
  status: /* @__PURE__ */ z.enum(['reverted', 'success', 'skipped']),
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
    executionGasUsed: /* @__PURE__ */ uintBigintNumberish(),
    gasUsed: /* @__PURE__ */ uintBigintNumberish(),
    stateGasUsed: /* @__PURE__ */ uintBigintNumberish(),
  }),
  {
    decode: core_FrameReceipt.fromRpc,
    encode: core_FrameReceipt.toRpc,
  },
)
