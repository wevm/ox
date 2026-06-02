/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
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
} as const

const toRpcType = {
  legacy: '0x0',
  eip2930: '0x1',
  eip1559: '0x2',
  eip4844: '0x3',
  eip7702: '0x4',
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

/** Transaction receipt schema. */
export const TransactionReceipt = z.object({
  blobGasPrice: z.optional(z_Uint.Uint),
  blobGasUsed: z.optional(z_Uint.Uint),
  blockHash: z_Hex.Hex,
  blockNumber: z_Uint.Uint,
  contractAddress: z.optional(z.union([z_Address.Address, z.null()])),
  cumulativeGasUsed: z_Uint.Uint,
  effectiveGasPrice: z_Uint.Uint,
  from: z_Address.Address,
  gasUsed: z_Uint.Uint,
  logs: z.array(z_Log.Log),
  logsBloom: z_Hex.Hex,
  root: z.optional(z_Hex.Hex),
  status: Status,
  to: z.union([z_Address.Address, z.null()]),
  transactionHash: z_Hex.Hex,
  transactionIndex: z_Number.Number,
  type: Type,
})
