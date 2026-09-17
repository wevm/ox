/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_MultisigConfig from '../../tempo/MultisigConfig.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'

/** Multisig owner schema. */
export const Owner = z.object({
  owner: z_Address.Address,
  weight: z.number(),
})

/** Native multisig configuration domain schema. */
export const Config = z
  .object({
    owners: z.readonly(z.array(Owner)),
    salt: z_Hex.Hex,
    threshold: z.number(),
    version: z.bigint(),
  })
  .check(
    z.refine(
      (value) => core_MultisigConfig.validate(value),
      'expected valid native multisig configuration',
    ),
  )

/** Native multisig configuration RPC schema. */
export const Rpc = z
  .object({
    owners: z.readonly(z.array(Owner)),
    salt: z_Hex.Hex,
    threshold: z.number(),
    version: z_Hex.Hex,
  })
  .check(
    z.refine((value) => {
      try {
        core_MultisigConfig.fromRpc(value)
        return true
      } catch {
        return false
      }
    }, 'expected valid native multisig configuration'),
  )

/** Codec decoding an RPC multisig configuration into a domain configuration. */
export const MultisigConfig = z.codec(Rpc, Config, {
  decode: (value) => core_MultisigConfig.fromRpc(value),
  encode: (value) => core_MultisigConfig.toRpc(value),
})
