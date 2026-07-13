/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_VirtualAddress from '../../tempo/VirtualAddress.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'

/** TIP-1022 virtual address schema. */
export const VirtualAddress = z_Address.Address.check(
  z.refine(
    (value) => core_VirtualAddress.validate(value),
    'expected virtual address',
  ),
)

/** Codec decoding `{ masterId, userTag }` into a virtual address. */
export const from = z.codec(
  z.object({ masterId: z_Hex.Hex, userTag: z_Hex.Hex }),
  VirtualAddress,
  {
    decode: (value) => core_VirtualAddress.from(value),
    encode: (value) => core_VirtualAddress.parse(value),
  },
)
