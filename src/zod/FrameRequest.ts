/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_FrameRequest from '../core/FrameRequest.js'
import * as z_Address from './Address.js'
import * as z_Frame from './Frame.js'
import * as z_Hex from './Hex.js'
import * as z from 'zod/mini'

const quantity = z_Hex.Hex.check(
  z.refine(
    (value) => /^0x(0|[1-9a-f][0-9a-f]*)$/.test(value),
    'Invalid RPC quantity',
  ),
)

const rpc = z
  .object({
    data: z.optional(z_Hex.Hex),
    executionGas: z.optional(quantity),
    flags: z.optional(z_Hex.Hex),
    mode: z_Hex.Hex,
    stateGas: z.optional(quantity),
    target: z.optional(z.nullable(z_Address.Address)),
    value: z.optional(quantity),
  })
  .check(
    z.refine((value) => {
      try {
        core_FrameRequest.fromRpc(value)
        return true
      } catch {
        return false
      }
    }, 'Invalid frame request'),
  )

/** Codec between RPC and decoded frame requests, preserving omitted gas limits. */
export const FrameRequest = z.codec(rpc, z_Frame.Decoded, {
  decode: core_FrameRequest.fromRpc,
  encode: core_FrameRequest.toRpc,
})

/** Encode-only frame request codec accepting numberish gas and value. */
export const FrameRequestToRpc = z.codec(rpc, z_Frame.DecodedToRpc, {
  decode: core_FrameRequest.fromRpc,
  encode: core_FrameRequest.toRpc,
})
