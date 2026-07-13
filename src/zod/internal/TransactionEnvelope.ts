/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z_Number from '../Number.js'
import * as z_Uint from '../Uint.js'
import * as z from 'zod/mini'

/** Strict integer schema family (decode RPC hex to `bigint`/`number`). */
export const strict = { uint: z_Uint.Uint, num: z_Number.Number } as const
/** Numberish integer schema family for encode-only `*ToRpc` schemas. */
export const toRpc = {
  uint: z_Uint.UintToRpc,
  num: z_Number.NumberToRpc,
} as const

export function type<input extends string, output extends string>(
  input: input,
  output: output,
) {
  return z.codec(z.literal(input), z.literal(output), {
    decode: () => output,
    encode: () => input,
  })
}

export function baseFields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    chainId: num,
    data: z.optional(z_Hex.Hex),
    input: z.optional(z_Hex.Hex),
    from: z.optional(z_Address.Address),
    gas: z.optional(uint),
    nonce: z.optional(uint),
    to: z.optional(z.union([z_Address.Address, z.null()])),
    type,
    value: z.optional(uint),
    r: z.optional(z_Hex.Hex),
    s: z.optional(z_Hex.Hex),
    yParity: z.optional(num),
    v: z.optional(num),
  }
}

export function signedBaseFields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...baseFields(type, uint, num),
    r: z_Hex.Hex,
    s: z_Hex.Hex,
  }
}

export function optionalChainIdFields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...baseFields(type, uint, num),
    chainId: z.optional(num),
  }
}

export function signedOptionalChainIdFields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...signedBaseFields(type, uint, num),
    chainId: z.optional(num),
  }
}
