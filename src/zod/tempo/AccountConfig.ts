/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_AccountConfig from '../../tempo/AccountConfig.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'

/** Account config owner schema. */
export const Owner = z.object({
  owner: z_Address.Address,
  weight: /* @__PURE__ */ z.number(),
})

/** Account configuration domain schema. */
export const Config = /* @__PURE__ */ z
  .object({
    owners: /* @__PURE__ */ z.readonly(/* @__PURE__ */ z.array(Owner)),
    salt: z_Hex.Hex,
    threshold: /* @__PURE__ */ z.number(),
    version: /* @__PURE__ */ z.bigint(),
  })
  .check(
    z.refine(
      (value) => core_AccountConfig.validate(value),
      'expected valid account configuration',
    ),
  )

/** Account configuration RPC schema. */
export const Rpc = /* @__PURE__ */ z
  .object({
    owners: /* @__PURE__ */ z.readonly(/* @__PURE__ */ z.array(Owner)),
    salt: z_Hex.Hex,
    threshold: /* @__PURE__ */ z.number(),
    version: z_Hex.Hex,
  })
  .check(
    z.refine((value) => {
      try {
        core_AccountConfig.fromRpc(value)
        return true
      } catch {
        return false
      }
    }, 'expected valid account configuration'),
  )

/** Codec decoding an RPC account configuration into a domain configuration. */
export const AccountConfig = z.codec(Rpc, Config, {
  decode: (value) => core_AccountConfig.fromRpc(value),
  encode: (value) => core_AccountConfig.toRpc(value),
})
