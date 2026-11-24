/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_FrameSignature from '../core/FrameSignature.js'
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z from 'zod/mini'

const publicKey = z.object({
  prefix: /* @__PURE__ */ z.number(),
  x: z_Hex.Hex,
  y: z_Hex.Hex,
})
const signature = z.object({
  r: z_Hex.Hex,
  s: z_Hex.Hex,
  yParity: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.number()),
})

/** Contract-defined frame signature schema. */
export const Arbitrary = z.object({
  payload: /* @__PURE__ */ z.optional(z_Hex.Hex),
  scheme: /* @__PURE__ */ z.union([
    /* @__PURE__ */ z.literal(0),
    /* @__PURE__ */ z.literal('arbitrary'),
  ]),
  signature: z_Hex.Hex,
  signer: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.undefined()),
})

/** secp256k1 frame signature schema. */
export const Secp256k1 = z.object({
  payload: /* @__PURE__ */ z.optional(z_Hex.Hex),
  scheme: /* @__PURE__ */ z.union([
    /* @__PURE__ */ z.literal(1),
    /* @__PURE__ */ z.literal('secp256k1'),
  ]),
  signature: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.union([
      z_Hex.Hex,
      /* @__PURE__ */ z.object({
        r: z_Hex.Hex,
        s: z_Hex.Hex,
        yParity: /* @__PURE__ */ z.number(),
      }),
    ]),
  ),
  signer: /* @__PURE__ */ z.optional(z_Address.Address),
})

const p256 = {
  payload: /* @__PURE__ */ z.optional(z_Hex.Hex),
  scheme: /* @__PURE__ */ z.union([
    /* @__PURE__ */ z.literal(2),
    /* @__PURE__ */ z.literal('p256'),
  ]),
  signer: /* @__PURE__ */ z.optional(z_Address.Address),
}
/** P-256 frame signature schema, including unsigned placeholders. */
export const P256 = z.union([
  /* @__PURE__ */ z.object({
    ...p256,
    publicKey,
    signature: /* @__PURE__ */ z.union([z_Hex.Hex, signature]),
  }),
  /* @__PURE__ */ z.object({
    ...p256,
    publicKey: /* @__PURE__ */ z.optional(publicKey),
    signature: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.literal('0x')),
  }),
])

/** Decoded frame signature schema. */
export const Decoded: z.ZodMiniType<
  core_FrameSignature.FrameSignature,
  core_FrameSignature.FrameSignature
> = /* @__PURE__ */ z
  .union([Arbitrary, Secp256k1, P256])
  .check(z.refine(core_FrameSignature.validate, 'Invalid frame signature'))

/** RPC frame signature schema. */
export const Rpc = /* @__PURE__ */ z
  .object({
    msg: /* @__PURE__ */ z.optional(z_Hex.Hex),
    scheme: /* @__PURE__ */ z.enum(['0x0', '0x1', '0x2']),
    signature: /* @__PURE__ */ z.optional(z_Hex.Hex),
    signer: /* @__PURE__ */ z.optional(
      /* @__PURE__ */ z.union([
        /* @__PURE__ */ z.literal('0x'),
        z_Address.Address,
      ]),
    ),
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
