/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z from 'zod/mini'

/** Access list item schema. */
export const Item = z.object({
  address: z_Address.Address,
  storageKeys: z.readonly(z.array(z_Hex.Hex32)),
})

/** Access list schema. */
export const AccessList = z.readonly(z.array(Item))

/** Access list tuple item schema. */
export const ItemTuple = z.readonly(
  z.tuple([z_Address.Address, z.readonly(z.array(z_Hex.Hex32))]),
)

/** Access list tuple schema. */
export const Tuple = z.readonly(z.array(ItemTuple))
