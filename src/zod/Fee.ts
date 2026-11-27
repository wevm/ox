/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

/** RPC fee history schema decoded to a fee history. */
export const FeeHistory = z.object({
  baseFeePerBlobGas: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.readonly(/* @__PURE__ */ z.array(z_Uint.Uint)),
  ),
  baseFeePerGas: /* @__PURE__ */ z.array(z_Uint.Uint),
  blobGasUsedRatio: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.readonly(
      /* @__PURE__ */ z.array(/* @__PURE__ */ z.number()),
    ),
  ),
  gasUsedRatio: /* @__PURE__ */ z.array(/* @__PURE__ */ z.number()),
  oldestBlock: z_Uint.Uint,
  reward: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.array(/* @__PURE__ */ z.array(z_Uint.Uint)),
  ),
})

/** Legacy RPC fee values schema decoded to legacy fee values. */
export const FeeValuesLegacy = z.object({
  gasPrice: z_Uint.Uint,
})

/** EIP-1559 RPC fee values schema decoded to EIP-1559 fee values. */
export const FeeValuesEip1559 = z.object({
  maxFeePerGas: z_Uint.Uint,
  maxPriorityFeePerGas: z_Uint.Uint,
})

/** EIP-4844 RPC fee values schema decoded to EIP-4844 fee values. */
export const FeeValuesEip4844 = z.object({
  maxFeePerBlobGas: z_Uint.Uint,
  maxFeePerGas: z_Uint.Uint,
  maxPriorityFeePerGas: z_Uint.Uint,
})

/** RPC fee values schema decoded to fee values. */
export const FeeValues = z.union([
  FeeValuesEip4844,
  FeeValuesEip1559,
  FeeValuesLegacy,
])
