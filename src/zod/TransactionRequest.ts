/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccessList from './AccessList.js'
import * as z_Address from './Address.js'
import * as z_Authorization from './Authorization.js'
import * as z_Frame from './Frame.js'
import * as z_FrameSignature from './FrameSignature.js'
import { chainId, chainIdToRpc } from './internal/Frame.js'
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

const type = z.codec(z.string(), z.string(), {
  decode: (value) => fromRpcType[value as keyof typeof fromRpcType] ?? value,
  encode: (value) => toRpcType[value as keyof typeof toRpcType] ?? value,
})

/** Transaction request schema. */
export const TransactionRequest = z.object(
  fields(
    z_Uint.Uint,
    z_Number.Number,
    z_Authorization.ListSigned,
    chainId,
    z_Frame.Frame,
  ),
)

/** Encode-only transaction request schema accepting numberish `toRpc` inputs. */
export const TransactionRequestToRpc = z.object(
  fields(
    z_Uint.UintToRpc,
    z_Number.NumberToRpc,
    z_Authorization.ListSignedToRpc,
    chainIdToRpc,
    z_Frame.FrameToRpc,
  ),
)

function fields<
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
  authorizationList extends z.ZodMiniType,
  chainId extends z.ZodMiniType,
  frame extends z.ZodMiniType,
>(
  uint: uint,
  num: num,
  authorizationList: authorizationList,
  chainId: chainId,
  frame: frame,
) {
  return {
    accessList: z.optional(z_AccessList.AccessList),
    authorizationList: z.optional(authorizationList),
    blobVersionedHashes: z.optional(z.readonly(z.array(z_Hex.Hex))),
    blobs: z.optional(z.readonly(z.array(z_Hex.Hex))),
    chainId: z.optional(chainId),
    data: z.optional(z_Hex.Hex),
    frames: z.optional(z.readonly(z.array(frame))),
    from: z.optional(z_Address.Address),
    gas: z.optional(uint),
    gasPrice: z.optional(uint),
    input: z.optional(z_Hex.Hex),
    maxFeePerBlobGas: z.optional(uint),
    maxFeePerGas: z.optional(uint),
    maxPriorityFeePerGas: z.optional(uint),
    nonce: z.optional(uint),
    signatures: z.optional(
      z.readonly(z.array(z_FrameSignature.FrameSignature)),
    ),
    to: z.optional(z.union([z_Address.Address, z.null()])),
    type: z.optional(type),
    value: z.optional(uint),
    r: z.optional(z_Hex.Hex),
    s: z.optional(z_Hex.Hex),
    yParity: z.optional(num),
    v: z.optional(num),
  }
}
