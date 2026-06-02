/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Hex from './Hex.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

const yParity = z.literal([0, 1])
const yParityHex = z_Hex.Hex.check(
  z.refine(
    (value) => value === '0x0' || value === '0x1',
    'expected yParity hex',
  ),
)

/** RPC signature schema decoded to a recovered signature. */
export const Signature = z.object({
  r: z_Hex.Hex32,
  s: z_Hex.Hex32,
  yParity: z_Uint.Uint8.check(
    z.refine((value) => value === 0 || value === 1, 'expected yParity'),
  ),
})

/** Legacy RPC signature schema decoded to a legacy signature. */
export const Legacy = z.object({
  r: z_Hex.Hex32,
  s: z_Hex.Hex32,
  v: z_Uint.Uint8,
})

/** Signature tuple schema. */
export const Tuple = z.readonly(z.tuple([yParityHex, z_Hex.Hex32, z_Hex.Hex32]))

/** Decoded recovered signature schema. */
export const Decoded = z.object({
  r: z_Hex.Hex32,
  s: z_Hex.Hex32,
  yParity,
})
