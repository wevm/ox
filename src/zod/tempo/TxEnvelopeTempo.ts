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
  v: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.number()),
  yParity: /* @__PURE__ */ z.number(),
})

/** Tempo transaction envelope type schema. */
export const Type = z.literal('tempo')

/** Tempo transaction call schema. */
export const Call = z.object({
  data: /* @__PURE__ */ z.optional(z_Hex.Hex),
  to: /* @__PURE__ */ z.optional(z_Address.Address),
  value: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.bigint()),
})

const baseFields = {
  accessList: /* @__PURE__ */ z.optional(z_AccessList.AccessList),
  authorizationList: /* @__PURE__ */ z.optional(
    z_AuthorizationTempo.DomainList,
  ),
  calls: /* @__PURE__ */ z.readonly(/* @__PURE__ */ z.array(Call)),
  chainId: /* @__PURE__ */ z.number(),
  feePayerSignature: /* @__PURE__ */ z.optional(
    /* @__PURE__ */ z.union([FeePayerSignature, /* @__PURE__ */ z.null()]),
  ),
  feeToken: /* @__PURE__ */ z.optional(z_Address.Address),
  from: /* @__PURE__ */ z.optional(z_Address.Address),
  gas: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.bigint()),
  keyAuthorization: /* @__PURE__ */ z.optional(z_KeyAuthorization.Domain),
  maxFeePerGas: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.bigint()),
  maxPriorityFeePerGas: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.bigint()),
  nonce: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.bigint()),
  nonceKey: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.bigint()),
  type: Type,
  validAfter: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.number()),
  validBefore: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.number()),
} as const

/** Tempo transaction envelope schema. */
export const TxEnvelopeTempo = z.object({
  ...baseFields,
  signature: /* @__PURE__ */ z.optional(z_SignatureEnvelope.Domain),
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
