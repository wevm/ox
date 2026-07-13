/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_ZoneRpcAuthentication from '../../tempo/ZoneRpcAuthentication.js'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'
import * as z_SignatureEnvelope from './SignatureEnvelope.js'

/** Zone RPC authentication version schema. */
export const Version = z.literal(0)

/** 29-byte fixed Zone RPC authentication field suffix schema. */
export const Fields = z_Hex.sizedHex(core_ZoneRpcAuthentication.fieldsSize)

/** Hex-encoded serialized Zone RPC authentication token schema. */
export const Serialized = z_Hex.Hex

/** Unsigned Zone RPC authentication token schema. */
export const Unsigned = z.object({
  chainId: z.number(),
  expiresAt: z.number(),
  issuedAt: z.number(),
  signature: z.optional(z.undefined()),
  version: Version,
  zoneId: z.number(),
})

/** Signed Zone RPC authentication token schema. */
export const Signed = z.object({
  chainId: z.number(),
  expiresAt: z.number(),
  issuedAt: z.number(),
  signature: z_SignatureEnvelope.Domain,
  version: Version,
  zoneId: z.number(),
})

/** Zone RPC authentication token schema. */
export const ZoneRpcAuthentication = z.union([Signed, Unsigned])

/** Codec decoding a serialized token into a signed Zone RPC authentication token. */
export const serialized = z.codec(Serialized, Signed, {
  decode: (value) => core_ZoneRpcAuthentication.deserialize(value),
  encode: (value) =>
    core_ZoneRpcAuthentication.serialize(
      value as core_ZoneRpcAuthentication.Signed,
    ),
})
