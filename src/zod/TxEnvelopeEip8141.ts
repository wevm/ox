/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_TxEnvelopeEip8141 from '../core/TxEnvelopeEip8141.js'
import * as z_Address from './Address.js'
import * as z_Frame from './Frame.js'
import * as z_FrameSignature from './FrameSignature.js'
import * as z_Hex from './Hex.js'
import * as z_TxEnvelopeEip4844 from './TxEnvelopeEip4844.js'
import * as z from 'zod/mini'

/** Decoded EIP-8141 envelope schema. */
export const Decoded = z
  .object(
    fields(z.bigint(), z.union([z.number(), z.bigint()]), z_Frame.Decoded),
  )
  .check(z.refine(core_TxEnvelopeEip8141.validate, 'Invalid frame transaction'))

/** RPC EIP-8141 envelope schema. */
export const Rpc = z.object({
  blobVersionedHashes: z.readonly(z.array(z_Hex.Hex)),
  chainId: z_Hex.Hex,
  frames: z.readonly(z.array(z_Frame.Rpc)),
  from: z_Address.Address,
  maxFeePerBlobGas: z_Hex.Hex,
  maxFeePerGas: z_Hex.Hex,
  maxPriorityFeePerGas: z_Hex.Hex,
  nonce: z_Hex.Hex,
  signatures: z.readonly(z.array(z_FrameSignature.Rpc)),
  type: z.literal('0x6'),
})

/** Codec between RPC and decoded EIP-8141 envelopes. */
export const TxEnvelopeEip8141 = z.codec(Rpc, Decoded, {
  decode: core_TxEnvelopeEip8141.fromRpc,
  encode: core_TxEnvelopeEip8141.toRpc,
})

/** Encode-only EIP-8141 envelope codec accepting numberish values. */
export const TxEnvelopeEip8141ToRpc = z.codec(
  Rpc,
  z.object(
    fields(
      z.union([z_Hex.Hex, z.bigint(), z.number()]),
      z.union([z_Hex.Hex, z.bigint(), z.number()]),
      z_Frame.DecodedToRpc,
    ),
  ),
  {
    decode: core_TxEnvelopeEip8141.fromRpc,
    encode: core_TxEnvelopeEip8141.toRpc,
  },
)

/** Codec between serialized and decoded EIP-8141 envelopes. */
export const serialized = z.codec(z_Hex.Hex, Decoded, {
  decode: (value) =>
    core_TxEnvelopeEip8141.deserialize(
      value as core_TxEnvelopeEip8141.Serialized,
    ),
  encode: core_TxEnvelopeEip8141.serialize,
})

function fields<
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
  frame extends z.ZodMiniType,
>(uint: uint, num: num, frame: frame) {
  return {
    blobVersionedHashes: z.optional(z.readonly(z.array(z_Hex.Hex))),
    chainId: num,
    frames: z.readonly(z.array(frame)),
    maxFeePerBlobGas: z.optional(uint),
    maxFeePerGas: z.optional(uint),
    maxPriorityFeePerGas: z.optional(uint),
    nonce: z.optional(uint),
    sender: z_Address.Address,
    sidecars: z.optional(z_TxEnvelopeEip4844.Sidecars),
    signatures: z.optional(z.readonly(z.array(z_FrameSignature.Decoded))),
    type: z.literal('eip8141'),
  }
}
