/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_TxEnvelopeTempo from '../../tempo/TxEnvelopeTempo.js'
import * as z_AccessList from '../AccessList.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z from 'zod/mini'
import * as z_AuthorizationTempo from './AuthorizationTempo.js'
import * as z_KeyAuthorization from './KeyAuthorization.js'
import * as z_SignatureEnvelope from './SignatureEnvelope.js'

const FeePayerSignature = z.object({
  r: z_Hex.Hex,
  s: z_Hex.Hex,
  v: z.optional(z.number()),
  yParity: z.number(),
})

/** Tempo transaction envelope type schema. */
export const Type = z.literal('tempo')

/** Tempo transaction call schema. */
export const Call = z.object({
  data: z.optional(z_Hex.Hex),
  to: z.optional(z_Address.Address),
  value: z.optional(z.bigint()),
})

const baseFields = {
  accessList: z.optional(z_AccessList.AccessList),
  authorizationList: z.optional(z_AuthorizationTempo.DomainList),
  calls: z.readonly(z.array(Call)),
  chainId: z.number(),
  feePayerSignature: z.optional(z.union([FeePayerSignature, z.null()])),
  feeToken: z.optional(z.union([z_Address.Address, z.bigint()])),
  from: z.optional(z_Address.Address),
  gas: z.optional(z.bigint()),
  keyAuthorization: z.optional(z_KeyAuthorization.Domain),
  maxFeePerGas: z.optional(z.bigint()),
  maxPriorityFeePerGas: z.optional(z.bigint()),
  nonce: z.optional(z.bigint()),
  nonceKey: z.optional(z.bigint()),
  type: Type,
  validAfter: z.optional(z.number()),
  validBefore: z.optional(z.number()),
} as const

/** Tempo transaction envelope schema. */
export const TxEnvelopeTempo = z.object({
  ...baseFields,
  signature: z.optional(z_SignatureEnvelope.Domain),
})

/** Signed tempo transaction envelope schema. */
export const Signed = z.object({
  ...baseFields,
  signature: z_SignatureEnvelope.Domain,
})

/** Codec decoding a hex-serialized tempo transaction envelope into a signed envelope. */
export const serialized = z.codec(z_Hex.Hex, Signed, {
  decode: (value) =>
    core_TxEnvelopeTempo.deserialize(
      value as core_TxEnvelopeTempo.Serialized,
    ) as never,
  encode: (value) =>
    core_TxEnvelopeTempo.serialize(
      value as unknown as core_TxEnvelopeTempo.Signed,
    ) as never,
})
