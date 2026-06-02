/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Number from './Number.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

/** RPC storage proof schema decoded to a storage proof. */
export const StorageProof = z.object({
  key: z_Hex.Hex,
  proof: z.readonly(z.array(z_Hex.Hex)),
  value: z_Uint.Uint,
})

/** RPC account proof schema decoded to an account proof. */
export const AccountProof = z.object({
  address: z_Address.Address,
  balance: z_Uint.Uint,
  codeHash: z_Hex.Hex,
  nonce: z_Number.Number,
  storageHash: z_Hex.Hex,
  accountProof: z.readonly(z.array(z_Hex.Hex)),
  storageProof: z.readonly(z.array(StorageProof)),
})
