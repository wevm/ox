/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as core_TxEnvelope from '../core/TxEnvelope.js'
import * as z_AccessList from './AccessList.js'
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_TxEnvelopeEip1559 from './TxEnvelopeEip1559.js'
import * as z_TxEnvelopeEip2930 from './TxEnvelopeEip2930.js'
import * as z_TxEnvelopeEip4844 from './TxEnvelopeEip4844.js'
import * as z_TxEnvelopeEip7702 from './TxEnvelopeEip7702.js'
import * as z_TxEnvelopeLegacy from './TxEnvelopeLegacy.js'
import { baseFields, signedBaseFields } from './internal/TransactionEnvelope.js'
import * as z from 'zod/mini'

const fromRpcType = {
  '0x0': 'legacy',
  '0x1': 'eip2930',
  '0x2': 'eip1559',
  '0x3': 'eip4844',
  '0x4': 'eip7702',
} as const

const toRpcType = {
  legacy: '0x0',
  eip2930: '0x1',
  eip1559: '0x2',
  eip4844: '0x3',
  eip7702: '0x4',
} as const

/** Transaction envelope type schema. */
export const Type = z.codec(z.string(), z.string(), {
  decode: (value) => fromRpcType[value as keyof typeof fromRpcType] ?? value,
  encode: (value) => toRpcType[value as keyof typeof toRpcType] ?? value,
})

/** Base transaction envelope schema. */
export const Base = z.object(baseFields(Type))

/** Signed base transaction envelope schema. */
export const BaseSigned = z.object(signedBaseFields(Type))

/** Transaction envelope schema. */
export const TransactionEnvelope = z.union([
  z_TxEnvelopeLegacy.TxEnvelopeLegacy,
  z_TxEnvelopeEip2930.TxEnvelopeEip2930,
  z_TxEnvelopeEip1559.TxEnvelopeEip1559,
  z_TxEnvelopeEip4844.TxEnvelopeEip4844,
  z_TxEnvelopeEip7702.TxEnvelopeEip7702,
])

/** Signed transaction envelope schema. */
export const Signed = z.union([
  z_TxEnvelopeLegacy.Signed,
  z_TxEnvelopeEip2930.Signed,
  z_TxEnvelopeEip1559.Signed,
  z_TxEnvelopeEip4844.Signed,
  z_TxEnvelopeEip7702.Signed,
])

/** Serialized transaction envelope schema. */
export const Serialized = z_Hex.Hex

const yParity = z
  .number()
  .check(z.refine((value) => value === 0 || value === 1, 'expected yParity'))

function decodedSignedBaseFields<const type extends string>(
  type: z.ZodMiniLiteral<type>,
) {
  return {
    chainId: z.number(),
    data: z.optional(z_Hex.Hex),
    input: z.optional(z_Hex.Hex),
    from: z.optional(z_Address.Address),
    gas: z.optional(z.bigint()),
    nonce: z.optional(z.bigint()),
    r: z_Hex.Hex,
    s: z_Hex.Hex,
    to: z.optional(z.union([z_Address.Address, z.null()])),
    type,
    v: z.optional(z.number()),
    value: z.optional(z.bigint()),
    yParity: z.optional(yParity),
  } as const
}

const DecodedAuthorization = z.object({
  address: z_Address.Address,
  chainId: z.number(),
  nonce: z.bigint(),
  r: z_Hex.Hex32,
  s: z_Hex.Hex32,
  yParity,
})

const SignedLegacyDecoded = z.object({
  ...decodedSignedBaseFields(z.literal('legacy')),
  chainId: z.optional(z.number()),
  gasPrice: z.optional(z.bigint()),
})

const SignedEip2930Decoded = z.object({
  ...decodedSignedBaseFields(z.literal('eip2930')),
  accessList: z.optional(z_AccessList.AccessList),
  gasPrice: z.optional(z.bigint()),
})

const SignedEip1559Decoded = z.object({
  ...decodedSignedBaseFields(z.literal('eip1559')),
  accessList: z.optional(z_AccessList.AccessList),
  maxFeePerGas: z.optional(z.bigint()),
  maxPriorityFeePerGas: z.optional(z.bigint()),
})

const SignedEip4844Decoded = z.object({
  ...decodedSignedBaseFields(z.literal('eip4844')),
  accessList: z.optional(z_AccessList.AccessList),
  blobVersionedHashes: z.readonly(z.array(z_Hex.Hex)),
  maxFeePerBlobGas: z.optional(z.bigint()),
  maxFeePerGas: z.optional(z.bigint()),
  maxPriorityFeePerGas: z.optional(z.bigint()),
  sidecars: z.optional(z_TxEnvelopeEip4844.Sidecars),
})

const SignedEip7702Decoded = z.object({
  ...decodedSignedBaseFields(z.literal('eip7702')),
  accessList: z.optional(z_AccessList.AccessList),
  authorizationList: z.readonly(z.array(DecodedAuthorization)),
  maxFeePerGas: z.optional(z.bigint()),
  maxPriorityFeePerGas: z.optional(z.bigint()),
})

/** Decoded signed transaction envelope schema. */
export const SignedDecoded = z.union([
  SignedLegacyDecoded,
  SignedEip2930Decoded,
  SignedEip1559Decoded,
  SignedEip4844Decoded,
  SignedEip7702Decoded,
])

/** Codec decoding a hex-serialized transaction envelope into a signed envelope. */
export const serialized = z.codec(z_Hex.Hex, SignedDecoded, {
  decode: (value) =>
    core_TxEnvelope.deserialize(value as core_TxEnvelope.Serialized) as never,
  encode: (value) => core_TxEnvelope.serialize(value as never) as never,
})
