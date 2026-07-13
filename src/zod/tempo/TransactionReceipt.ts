/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z_Log from '../Log.js'
import * as z_Number from '../Number.js'
import * as z_Uint from '../Uint.js'
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
  '0x76': 'tempo',
} as const

const toRpcType = {
  legacy: '0x0',
  eip2930: '0x1',
  eip1559: '0x2',
  eip4844: '0x3',
  eip7702: '0x4',
  tempo: '0x76',
} as const

/** Tempo transaction receipt status schema. */
export const Status = z.codec(
  z.union([z.literal('0x0'), z.literal('0x1')]),
  z.union([z.literal('reverted'), z.literal('success')]),
  {
    decode: (value) => fromRpcStatus[value],
    encode: (value) => toRpcStatus[value],
  },
)

/** Tempo transaction receipt type schema. */
export const Type = z.codec(z.string(), z.string(), {
  decode: (value) => fromRpcType[value as keyof typeof fromRpcType] ?? value,
  encode: (value) => toRpcType[value as keyof typeof toRpcType] ?? value,
})

/** Tempo transaction receipt schema. */
export const TransactionReceipt = z.object(
  fields(z_Uint.Uint, z_Number.Number, z_Log.Log),
)

/** Encode-only tempo transaction receipt schema accepting numberish `toRpc` inputs. */
export const TransactionReceiptToRpc = z.object(
  fields(z_Uint.UintToRpc, z_Number.NumberToRpc, z_Log.LogToRpc),
)

function fields<
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
  log extends z.ZodMiniType,
>(uint: uint, num: num, log: log) {
  return {
    blobGasPrice: z.optional(uint),
    blobGasUsed: z.optional(uint),
    blockHash: z_Hex.Hex,
    blockNumber: uint,
    contractAddress: z.optional(z.union([z_Address.Address, z.null()])),
    cumulativeGasUsed: uint,
    effectiveGasPrice: uint,
    feePayer: z.optional(z_Address.Address),
    feeToken: z.optional(z_Address.Address),
    from: z_Address.Address,
    gasUsed: uint,
    logs: z.array(log),
    logsBloom: z_Hex.Hex,
    root: z.optional(z_Hex.Hex),
    status: Status,
    to: z.union([z_Address.Address, z.null()]),
    transactionHash: z_Hex.Hex,
    transactionIndex: num,
    type: Type,
  }
}
