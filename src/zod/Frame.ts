/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_Frame from '../core/Frame.js'
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z from 'zod/mini'

const Mode = z.union([
  /* @__PURE__ */ z.number(),
  /* @__PURE__ */ z.enum(['default', 'sender', 'verify']),
])
const Flags = z.union([
  /* @__PURE__ */ z.number(),
  /* @__PURE__ */ z.enum([
    'approveExecution',
    'approveExecutionAndPayment',
    'approvePayment',
    'atomicBatch',
    'none',
  ]),
])

/** Decoded frame schema. */
export const Decoded: z.ZodMiniType<core_Frame.Frame, core_Frame.Frame> =
  /* @__PURE__ */ z
    .object(fields(z.bigint()))
    .check(z.refine(core_Frame.validate, 'Invalid frame'))

/** RPC frame schema. */
export const Rpc = /* @__PURE__ */ z
  .object({
    data: z_Hex.Hex,
    executionGas: z_Hex.Hex,
    flags: z_Hex.Hex,
    mode: z_Hex.Hex,
    stateGas: z_Hex.Hex,
    target: /* @__PURE__ */ z.optional(
      /* @__PURE__ */ z.nullable(z_Address.Address),
    ),
    value: z_Hex.Hex,
  })
  .check(
    z.refine((value) => {
      try {
        core_Frame.fromRpc(value)
        return true
      } catch {
        return false
      }
    }, 'Invalid frame'),
  )

/** Codec between RPC and decoded frames. */
export const Frame = z.codec(Rpc, Decoded, {
  decode: core_Frame.fromRpc,
  encode: core_Frame.toRpc,
})

/** Decoded frame schema accepting numberish budgets. */
export const DecodedToRpc = /* @__PURE__ */ z
  .object(
    fields(
      z.union([
        z_Hex.Hex,
        /* @__PURE__ */ z.bigint(),
        /* @__PURE__ */ z.number(),
      ]),
    ),
  )
  .check(
    z.refine((value) => {
      try {
        core_Frame.fromRpc(core_Frame.toRpc(value))
        return true
      } catch {
        return false
      }
    }, 'Invalid frame'),
  )

/** Encode-only frame codec accepting numberish budgets. */
export const FrameToRpc = z.codec(Rpc, DecodedToRpc, {
  decode: core_Frame.fromRpc,
  encode: core_Frame.toRpc,
})

// @__NO_SIDE_EFFECTS__
function fields<uint extends z.ZodMiniType>(uint: uint) {
  return {
    data: z.optional(z_Hex.Hex),
    executionGas: z.optional(uint),
    flags: z.optional(Flags),
    mode: z.optional(Mode),
    stateGas: z.optional(uint),
    to: z.optional(z_Address.Address),
    value: z.optional(uint),
  }
}
