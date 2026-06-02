/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z_Number from '../Number.js'
import * as z_Uint from '../Uint.js'
import * as z from 'zod/mini'
import * as z_SignatureEnvelope from './SignatureEnvelope.js'

/** Unsigned AA authorization schema. */
export const Unsigned = z.object({
  address: z_Address.Address,
  chainId: z_Number.Number,
  nonce: z_Uint.Uint,
  signature: z.optional(z.undefined()),
})

/** Signed AA authorization schema. */
export const Signed = z.object({
  address: z_Address.Address,
  chainId: z_Number.Number,
  nonce: z_Uint.Uint,
  signature: z_SignatureEnvelope.SignatureEnvelope,
})

/** Decoded signed AA authorization schema. */
export const Domain = z.object({
  address: z_Address.Address,
  chainId: z.number(),
  nonce: z.bigint(),
  signature: z_SignatureEnvelope.Domain,
})

/** Decoded signed AA authorization list schema. */
export const DomainList = z.readonly(z.array(Domain))

/** AA authorization schema. */
export const AuthorizationTempo = z.union([Signed, Unsigned])

/** AA authorization list schema. */
export const List = z.readonly(z.array(AuthorizationTempo))

/** Signed AA authorization list schema. */
export const ListSigned = z.readonly(z.array(Signed))

/** RPC AA authorization schema. */
export const Rpc = z.object({
  address: z_Address.Address,
  chainId: z_Hex.Hex,
  nonce: z_Hex.Hex,
  signature: z_SignatureEnvelope.Rpc,
})

/** RPC AA authorization list schema. */
export const ListRpc = z.readonly(z.array(Rpc))

/** Unsigned AA authorization tuple schema. */
export const TupleUnsigned = z.readonly(
  z.tuple([z_Hex.Hex, z_Address.Address, z_Hex.Hex]),
)

/** Signed AA authorization tuple schema. */
export const TupleSigned = z.readonly(
  z.tuple([z_Hex.Hex, z_Address.Address, z_Hex.Hex, z_Hex.Hex]),
)

/** AA authorization tuple schema. */
export const Tuple = z.union([TupleSigned, TupleUnsigned])

/** AA authorization tuple list schema. */
export const TupleList = z.readonly(z.array(Tuple))

/** Signed AA authorization tuple list schema. */
export const TupleListSigned = z.readonly(z.array(TupleSigned))
