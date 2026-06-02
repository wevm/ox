/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Number from './Number.js'
import * as z_Uint from './Uint.js'
import * as z from 'zod/mini'

const yParityHex = z_Hex.Hex.check(
  z.refine(
    (value) => value === '0x0' || value === '0x1',
    'expected yParity hex',
  ),
)

/** Unsigned EIP-7702 authorization schema. */
export const Unsigned = z.object({
  address: z_Address.Address,
  chainId: z_Number.Number,
  nonce: z_Uint.Uint,
  r: z.optional(z.undefined()),
  s: z.optional(z.undefined()),
  yParity: z.optional(z.undefined()),
})

/** Signed EIP-7702 authorization schema. */
export const Signed = z.object({
  address: z_Address.Address,
  chainId: z_Number.Number,
  nonce: z_Uint.Uint,
  r: z_Hex.Hex32,
  s: z_Hex.Hex32,
  yParity: z_Uint.Uint8.check(
    z.refine((value) => value === 0 || value === 1, 'expected yParity'),
  ),
})

/** EIP-7702 authorization schema. */
export const Authorization = z.union([Signed, Unsigned])

/** EIP-7702 authorization list schema. */
export const List = z.readonly(z.array(Authorization))

/** Signed EIP-7702 authorization list schema. */
export const ListSigned = z.readonly(z.array(Signed))

/** Unsigned EIP-7702 authorization tuple schema. */
export const TupleUnsigned = z.readonly(
  z.tuple([z_Hex.Hex, z_Address.Address, z_Hex.Hex]),
)

/** Signed EIP-7702 authorization tuple schema. */
export const TupleSigned = z.readonly(
  z.tuple([
    z_Hex.Hex,
    z_Address.Address,
    z_Hex.Hex,
    yParityHex,
    z_Hex.Hex32,
    z_Hex.Hex32,
  ]),
)

/** EIP-7702 authorization tuple schema. */
export const Tuple = z.union([TupleSigned, TupleUnsigned])

/** EIP-7702 authorization tuple list schema. */
export const TupleList = z.readonly(z.array(Tuple))

/** Signed EIP-7702 authorization tuple list schema. */
export const TupleListSigned = z.readonly(z.array(TupleSigned))
