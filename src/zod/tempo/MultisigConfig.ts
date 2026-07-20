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

/** Native multisig configuration schema. */
export const Config = z
  .object({
    salt: z.optional(z_Hex.Hex),
    threshold: z.number(),
    owners: z.readonly(z.array(Owner)),
  })
  .check(
    z.refine(
      (value) => core_MultisigConfig.validate(value),
      'expected valid native multisig configuration',
    ),
  )
