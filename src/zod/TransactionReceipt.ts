/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as Quantity from '../core/internal/quantity.js'
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Log from './Log.js'
import * as z_Number from './Number.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

const fromRpcStatus = {
  '0x0': 'reverted',
  '0x1': 'success',
} as const

const toRpcStatus = {
  reverted: '0x0',
  success: '0x1',
} as const

const fromRpcType = {
  '0x0': 'legacy',
  '0x1': 'eip2930',
  '0x2': 'eip1559',
  '0x3': 'eip4844',
  '0x4': 'eip7702',
  '0x6': 'eip8141',
} as const

const toRpcType = {
  legacy: '0x0',
  eip2930: '0x1',
  eip1559: '0x2',
  eip4844: '0x3',
  eip7702: '0x4',
  eip8141: '0x6',
} as const

/** Transaction receipt status schema. */
export const Status = z.codec(
  z.union([z.literal('0x0'), z.literal('0x1')]),
  z.union([z.literal('reverted'), z.literal('success')]),
  {
    decode: (value) => fromRpcStatus[value],
    encode: (value) => toRpcStatus[value],
  },
)

/** Transaction receipt type schema. */
export const Type = z.codec(z.string(), z.string(), {
  decode: (value) => fromRpcType[value as keyof typeof fromRpcType] ?? value,
  encode: (value) => toRpcType[value as keyof typeof toRpcType] ?? value,
})

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

/** Per-frame receipt codec. */
export const FrameReceipt = z.codec(frameReceiptRpc, frameReceiptDecoded, {
  decode: (value) => ({
    gasUsed: BigInt(value.executionGasUsed),
    logs: value.logs,
    stateGasUsed: BigInt(value.stateGasUsed),
    status: ({ 0: 'reverted', 1: 'success', 2: 'skipped' } as const)[
      value.status
    ],
  }),
  encode: (value) => ({
    executionGasUsed: Quantity.fromNumberish(value.gasUsed),
    logs: value.logs,
    stateGasUsed: Quantity.fromNumberish(value.stateGasUsed),
    status: ({ reverted: 0, skipped: 2, success: 1 } as const)[value.status],
  }),
})

/** Encode-only per-frame receipt codec accepting numberish gas. */
export const FrameReceiptToRpc = z.codec(
  frameReceiptRpc,
  z.extend(frameReceiptDecoded, {
    gasUsed: z.union([z_Hex.Hex, z.bigint(), z.number()]),
    stateGasUsed: z.union([z_Hex.Hex, z.bigint(), z.number()]),
  }),
  {
    decode: (value) => z.decode(FrameReceipt, value),
    encode: (value) => ({
      executionGasUsed: Quantity.fromNumberish(value.gasUsed),
      logs: value.logs,
      stateGasUsed: Quantity.fromNumberish(value.stateGasUsed),
      status: ({ reverted: 0, skipped: 2, success: 1 } as const)[value.status],
    }),
  },
)

/** Transaction receipt schema. */
export const TransactionReceipt = z.object(
  fields(z_Uint.Uint, z_Number.Number, z_Log.Log, FrameReceipt),
)

/** Encode-only transaction receipt schema accepting numberish `toRpc` inputs. */
export const TransactionReceiptToRpc = z.object(
  fields(
    z_Uint.UintToRpc,
    z_Number.NumberToRpc,
    z_Log.LogToRpc,
    FrameReceiptToRpc,
  ),
)

function fields<
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
  log extends z.ZodMiniType,
  frame extends z.ZodMiniType,
>(uint: uint, num: num, log: log, frame: frame) {
  return {
    blobGasPrice: z.optional(uint),
    blobGasUsed: z.optional(uint),
    blockHash: z_Hex.Hex,
    blockNumber: uint,
    contractAddress: z.optional(z.union([z_Address.Address, z.null()])),
    cumulativeGasUsed: uint,
    effectiveGasPrice: uint,
    frameReceipts: z.optional(z.readonly(z.array(frame))),
    from: z_Address.Address,
    gasUsed: uint,
    logs: z.array(log),
    logsBloom: z_Hex.Hex,
    payer: z.optional(z_Address.Address),
    root: z.optional(z_Hex.Hex),
    status: Status,
    to: z.union([z_Address.Address, z.null()]),
    transactionHash: z_Hex.Hex,
    transactionIndex: num,
    type: Type,
  }
}
