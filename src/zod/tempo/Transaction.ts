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

/** Encode-only tempo transaction call schema accepting numberish `toRpc` inputs. */
const CallToRpc = z.codec(
  z.object({
    input: z.optional(z_Hex.Hex),
    to: z.optional(z_Hex.Hex),
    value: z.optional(z_Hex.Hex),
  }),
  z.object({
    data: z.optional(z_Hex.Hex),
    to: z.optional(z_Hex.Hex),
    value: z.optional(z_Uint.UintToRpc),
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
export const Tempo = z.object(
  fields(z_Uint.Uint, z_Number.Number, Call, z_AuthorizationTempo.ListSigned),
)

/** Encode-only tempo transaction schema accepting numberish `toRpc` inputs. */
export const TempoToRpc = z.object(
  fields(
    z_Uint.UintToRpc,
    z_Number.NumberToRpc,
    CallToRpc,
    z_AuthorizationTempo.ListSignedToRpc,
  ),
)

function fields<
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
  call extends z.ZodMiniType,
  authList extends z.ZodMiniType,
>(uint: uint, num: num, call: call, authList: authList) {
  return {
    accessList: z_AccessList.AccessList,
    authorizationList: z.optional(authList),
    blockHash: z_Hex.Hex,
    blockNumber: uint,
    blockTimestamp: z.optional(uint),
    calls: z.readonly(z.array(call)),
    chainId: num,
    feePayer: z.optional(z_Address.Address),
    feePayerSignature: z.optional(FeePayerSignature),
    feeToken: z_Address.Address,
    from: z_Address.Address,
    gas: uint,
    gasPrice: z.optional(uint),
    hash: z_Hex.Hex,
    keyAuthorization: z.optional(z_KeyAuthorization.KeyAuthorization),
    maxFeePerGas: uint,
    maxPriorityFeePerGas: uint,
    nonce: uint,
    nonceKey: z.optional(uint),
    signature: z_SignatureEnvelope.SignatureEnvelope,
    transactionIndex: num,
    type: Type,
    validAfter: z.optional(num),
    validBefore: z.optional(num),
  }
}

/** Tempo transaction schema (union of tempo + standard transaction types). */
export const Transaction = z.union([Tempo, z_Transaction.Transaction])

/** Encode-only tempo transaction schema accepting numberish `toRpc` inputs. */
export const TransactionToRpc = z.union([
  TempoToRpc,
  z_Transaction.TransactionToRpc,
])

/** Pending tempo transaction schema. */
export const Pending = z_Transaction.Pending
