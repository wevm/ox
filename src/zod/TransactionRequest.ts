/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccessList from './AccessList.js'
import * as z_Address from './Address.js'
import * as z_Authorization from './Authorization.js'
import * as z_Hex from './Hex.js'
import * as z_Number from './Number.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

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

const type = z.codec(z.string(), z.string(), {
  decode: (value) => fromRpcType[value as keyof typeof fromRpcType] ?? value,
  encode: (value) => toRpcType[value as keyof typeof toRpcType] ?? value,
})

/** Transaction request schema. */
export const TransactionRequest = z.object({
  accessList: z.optional(z_AccessList.AccessList),
  authorizationList: z.optional(z_Authorization.ListSigned),
  blobVersionedHashes: z.optional(z.readonly(z.array(z_Hex.Hex))),
  blobs: z.optional(z.readonly(z.array(z_Hex.Hex))),
  chainId: z.optional(z_Number.Number),
  data: z.optional(z_Hex.Hex),
  input: z.optional(z_Hex.Hex),
  from: z.optional(z_Address.Address),
  gas: z.optional(z_Uint.Uint),
  gasPrice: z.optional(z_Uint.Uint),
  maxFeePerBlobGas: z.optional(z_Uint.Uint),
  maxFeePerGas: z.optional(z_Uint.Uint),
  maxPriorityFeePerGas: z.optional(z_Uint.Uint),
  nonce: z.optional(z_Uint.Uint),
  to: z.optional(z.union([z_Address.Address, z.null()])),
  type: z.optional(type),
  value: z.optional(z_Uint.Uint),
  r: z.optional(z_Hex.Hex),
  s: z.optional(z_Hex.Hex),
  yParity: z.optional(z_Number.Number),
  v: z.optional(z_Number.Number),
})
