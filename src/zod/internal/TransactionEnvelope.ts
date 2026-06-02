/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z_Number from '../Number.js'
import * as z_Uint from '../Uint.js'
import * as z from 'zod/mini'

export function type<input extends string, output extends string>(
  input: input,
  output: output,
) {
  return z.codec(z.literal(input), z.literal(output), {
    decode: () => output,
    encode: () => input,
  })
}

export function baseFields<const schema extends z.ZodMiniType<string, string>>(
  type: schema,
) {
  return {
    chainId: z_Number.Number,
    data: z.optional(z_Hex.Hex),
    input: z.optional(z_Hex.Hex),
    from: z.optional(z_Address.Address),
    gas: z.optional(z_Uint.Uint),
    nonce: z.optional(z_Uint.Uint),
    to: z.optional(z.union([z_Address.Address, z.null()])),
    type,
    value: z.optional(z_Uint.Uint),
    r: z.optional(z_Hex.Hex),
    s: z.optional(z_Hex.Hex),
    yParity: z.optional(z_Number.Number),
    v: z.optional(z_Number.Number),
  }
}

export function signedBaseFields<
  const schema extends z.ZodMiniType<string, string>,
>(type: schema) {
  return {
    ...baseFields(type),
    r: z_Hex.Hex,
    s: z_Hex.Hex,
  }
}

export function optionalChainIdFields<
  const schema extends z.ZodMiniType<string, string>,
>(type: schema) {
  return {
    ...baseFields(type),
    chainId: z.optional(z_Number.Number),
  }
}

export function signedOptionalChainIdFields<
  const schema extends z.ZodMiniType<string, string>,
>(type: schema) {
  return {
    ...signedBaseFields(type),
    chainId: z.optional(z_Number.Number),
  }
}
