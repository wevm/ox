/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_Frame from '../core/Frame.js'
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z from 'zod/mini'

const Mode = z.union([z.number(), z.enum(['default', 'sender', 'verify'])])
const Flags = z.union([
  z.number(),
  z.enum([
    'approveExecution',
    'approveExecutionAndPayment',
    'approvePayment',
    'atomicBatch',
    'none',
  ]),
])

/** Decoded frame schema. */
export const Decoded: z.ZodMiniType<core_Frame.Frame, core_Frame.Frame> = z
  .object(fields(z.bigint()))
  .check(z.refine(core_Frame.validate, 'Invalid frame'))

/** RPC frame schema. */
export const Rpc = z
  .object({
    data: z_Hex.Hex,
    executionGasLimit: z_Hex.Hex,
    flags: z.number(),
    mode: z.number(),
    stateGasLimit: z_Hex.Hex,
    target: z.optional(z.nullable(z_Address.Address)),
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
export const DecodedToRpc = z
  .object(fields(z.union([z_Hex.Hex, z.bigint(), z.number()])))
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
