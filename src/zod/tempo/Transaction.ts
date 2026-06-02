/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccessList from '../AccessList.js'
import * as z_Address from '../Address.js'
import * as z_Hex from '../Hex.js'
import * as z_Number from '../Number.js'
import * as z_Transaction from '../Transaction.js'
import * as z_Uint from '../Uint.js'
import * as z from 'zod/mini'
import * as z_AuthorizationTempo from './AuthorizationTempo.js'
import * as z_KeyAuthorization from './KeyAuthorization.js'
import * as z_SignatureEnvelope from './SignatureEnvelope.js'

const Type = z.codec(z.literal('0x76'), z.literal('tempo'), {
  decode: () => 'tempo' as const,
  encode: () => '0x76' as const,
})

const FeePayerSignature = z.object({
  r: z_Hex.Hex,
  s: z_Hex.Hex,
  v: z.optional(z_Number.Number),
  yParity: z_Number.Number,
})

/** Tempo transaction call schema (decodes the RPC `input` field to `data`). */
const Call = z.codec(
  z.object({
    input: z.optional(z_Hex.Hex),
    to: z.optional(z_Hex.Hex),
    value: z.optional(z_Hex.Hex),
  }),
  z.object({
    data: z.optional(z_Hex.Hex),
    to: z.optional(z_Hex.Hex),
    value: z.optional(z_Uint.Uint),
  }),
  {
    decode: (value) => ({
      data: value.input,
      to: value.to,
      value: value.value === '0x' ? undefined : value.value,
    }),
    encode: (value) => ({
      input: value.data,
      to: value.to,
      value: value.value,
    }),
  },
)

/** Tempo transaction schema (type `0x76`). */
export const Tempo = z.object({
  accessList: z_AccessList.AccessList,
  authorizationList: z.optional(z_AuthorizationTempo.ListSigned),
  blockHash: z_Hex.Hex,
  blockNumber: z_Uint.Uint,
  blockTimestamp: z.optional(z_Uint.Uint),
  calls: z.readonly(z.array(Call)),
  chainId: z_Number.Number,
  feePayer: z.optional(z_Address.Address),
  feePayerSignature: z.optional(FeePayerSignature),
  feeToken: z_Address.Address,
  from: z_Address.Address,
  gas: z_Uint.Uint,
  gasPrice: z.optional(z_Uint.Uint),
  hash: z_Hex.Hex,
  keyAuthorization: z.optional(z_KeyAuthorization.KeyAuthorization),
  maxFeePerGas: z_Uint.Uint,
  maxPriorityFeePerGas: z_Uint.Uint,
  nonce: z_Uint.Uint,
  nonceKey: z.optional(z_Uint.Uint),
  signature: z_SignatureEnvelope.SignatureEnvelope,
  transactionIndex: z_Number.Number,
  type: Type,
  validAfter: z.optional(z_Number.Number),
  validBefore: z.optional(z_Number.Number),
})

/** Tempo transaction schema (union of tempo + standard transaction types). */
export const Transaction = z.union([Tempo, z_Transaction.Transaction])

/** Pending tempo transaction schema. */
export const Pending = z_Transaction.Pending
