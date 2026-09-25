/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_FrameSignature from '../core/FrameSignature.js'
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z from 'zod/mini'

const publicKey = z.object({ prefix: z.number(), x: z_Hex.Hex, y: z_Hex.Hex })
const signature = z.object({
  r: z_Hex.Hex,
  s: z_Hex.Hex,
  yParity: z.optional(z.number()),
})

/** Contract-defined frame signature schema. */
export const Arbitrary = z.object({
  payload: z.optional(z_Hex.Hex),
  scheme: z.union([z.literal(0), z.literal('arbitrary')]),
  signature: z_Hex.Hex,
  signer: z.optional(z.undefined()),
})

/** secp256k1 frame signature schema. */
export const Secp256k1 = z.object({
  payload: z.optional(z_Hex.Hex),
  scheme: z.union([z.literal(1), z.literal('secp256k1')]),
  signature: z.optional(
    z.union([
      z_Hex.Hex,
      z.object({ r: z_Hex.Hex, s: z_Hex.Hex, yParity: z.number() }),
    ]),
  ),
  signer: z.optional(z_Address.Address),
})

const p256 = {
  payload: z.optional(z_Hex.Hex),
  scheme: z.union([z.literal(2), z.literal('p256')]),
  signer: z.optional(z_Address.Address),
}
/** P-256 frame signature schema, including unsigned placeholders. */
export const P256 = z.union([
  z.object({ ...p256, publicKey, signature: z.union([z_Hex.Hex, signature]) }),
  z.object({
    ...p256,
    publicKey: z.optional(publicKey),
    signature: z.optional(z.undefined()),
  }),
])

/** Decoded frame signature schema. */
export const Decoded: z.ZodMiniType<
  core_FrameSignature.FrameSignature,
  core_FrameSignature.FrameSignature
> = z
  .union([Arbitrary, Secp256k1, P256])
  .check(z.refine(core_FrameSignature.validate, 'Invalid frame signature'))

/** RPC frame signature schema. */
export const Rpc = z
  .object({
    msg: z.optional(z_Hex.Hex),
    scheme: z.enum(['0x0', '0x1', '0x2']),
    signature: z.optional(z_Hex.Hex),
    signer: z.optional(z.nullable(z_Address.Address)),
  })
  .check(
    z.refine((value) => {
      try {
        core_FrameSignature.fromRpc(value)
        return true
      } catch {
        return false
      }
    }, 'Invalid frame signature'),
  )

/** Codec between RPC and structured frame signatures. */
export const FrameSignature = z.codec(Rpc, Decoded, {
  decode: core_FrameSignature.fromRpc,
  encode: core_FrameSignature.toRpc,
})
