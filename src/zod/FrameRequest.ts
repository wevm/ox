/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_FrameRequest from '../core/FrameRequest.js'
import * as z_Address from './Address.js'
import * as z_Frame from './Frame.js'
import * as z_Hex from './Hex.js'
import * as z from 'zod/mini'

const quantityRegex = /^0x(0|[1-9a-f][0-9a-f]*)$/

const quantity = /* @__PURE__ */ z_Hex.Hex.check(
  z.refine((value) => quantityRegex.test(value), 'Invalid RPC quantity'),
)

const rpc = /* @__PURE__ */ z
  .object({
    data: /* @__PURE__ */ z.optional(z_Hex.Hex),
    executionGas: /* @__PURE__ */ z.optional(quantity),
    flags: /* @__PURE__ */ z.optional(z_Hex.Hex),
    mode: z_Hex.Hex,
    stateGas: /* @__PURE__ */ z.optional(quantity),
    target: /* @__PURE__ */ z.optional(
      /* @__PURE__ */ z.nullable(z_Address.Address),
    ),
    value: /* @__PURE__ */ z.optional(quantity),
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
