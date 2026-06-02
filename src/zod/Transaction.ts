/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccessList from './AccessList.js'
import * as z_Address from './Address.js'
import * as z_Authorization from './Authorization.js'
import * as z_Hex from './Hex.js'
import * as z_Number from './Number.js'
import * as z_Uint from './Uint.js'
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

/** Transaction type schema. */
export const Type = z.codec(z.string(), z.string(), {
  decode: (value) => fromRpcType[value as keyof typeof fromRpcType] ?? value,
  encode: (value) => toRpcType[value as keyof typeof toRpcType] ?? value,
})

const LegacyType = type('0x0', 'legacy')
const Eip2930Type = type('0x1', 'eip2930')
const Eip1559Type = type('0x2', 'eip1559')
const Eip4844Type = type('0x3', 'eip4844')
const Eip7702Type = type('0x4', 'eip7702')
const UnknownType = z_Hex.Hex.check(
  z.refine(
    (value) => !(value in fromRpcType),
    'expected unknown transaction type',
  ),
)

/** Base transaction schema. */
export const Base = z.object(baseFields(Type))

/** Pending base transaction schema. */
export const PendingBase = z.object(pendingBaseFields(Type))

/** Legacy transaction schema. */
export const Legacy = z.object(legacyFields(LegacyType))

/** Pending legacy transaction schema. */
export const PendingLegacy = z.object(pendingLegacyFields(LegacyType))

/** EIP-1559 transaction schema. */
export const Eip1559 = z.object({
  ...baseFields(Eip1559Type),
  accessList: z_AccessList.AccessList,
  gasPrice: z.optional(z_Uint.Uint),
  maxFeePerGas: z_Uint.Uint,
  maxPriorityFeePerGas: z_Uint.Uint,
})

/** Pending EIP-1559 transaction schema. */
export const PendingEip1559 = z.object({
  ...pendingBaseFields(Eip1559Type),
  accessList: z_AccessList.AccessList,
  gasPrice: z.optional(z_Uint.Uint),
  maxFeePerGas: z_Uint.Uint,
  maxPriorityFeePerGas: z_Uint.Uint,
})

/** EIP-2930 transaction schema. */
export const Eip2930 = z.object({
  ...baseFields(Eip2930Type),
  accessList: z_AccessList.AccessList,
  gasPrice: z_Uint.Uint,
})

/** Pending EIP-2930 transaction schema. */
export const PendingEip2930 = z.object({
  ...pendingBaseFields(Eip2930Type),
  accessList: z_AccessList.AccessList,
  gasPrice: z_Uint.Uint,
})

/** EIP-4844 transaction schema. */
export const Eip4844 = z.object({
  ...baseFields(Eip4844Type),
  accessList: z_AccessList.AccessList,
  blobVersionedHashes: z.readonly(z.array(z_Hex.Hex)),
  maxFeePerBlobGas: z_Uint.Uint,
  maxFeePerGas: z_Uint.Uint,
  maxPriorityFeePerGas: z_Uint.Uint,
})

/** Pending EIP-4844 transaction schema. */
export const PendingEip4844 = z.object({
  ...pendingBaseFields(Eip4844Type),
  accessList: z_AccessList.AccessList,
  blobVersionedHashes: z.readonly(z.array(z_Hex.Hex)),
  maxFeePerBlobGas: z_Uint.Uint,
  maxFeePerGas: z_Uint.Uint,
  maxPriorityFeePerGas: z_Uint.Uint,
})

/** EIP-7702 transaction schema. */
export const Eip7702 = z.object({
  ...baseFields(Eip7702Type),
  accessList: z_AccessList.AccessList,
  authorizationList: z_Authorization.ListSigned,
  maxFeePerGas: z_Uint.Uint,
  maxPriorityFeePerGas: z_Uint.Uint,
})

/** Pending EIP-7702 transaction schema. */
export const PendingEip7702 = z.object({
  ...pendingBaseFields(Eip7702Type),
  accessList: z_AccessList.AccessList,
  authorizationList: z_Authorization.ListSigned,
  maxFeePerGas: z_Uint.Uint,
  maxPriorityFeePerGas: z_Uint.Uint,
})

/** Unknown typed transaction schema. */
export const Unknown = z.object(baseFields(UnknownType))

/** Pending unknown typed transaction schema. */
export const PendingUnknown = z.object(pendingBaseFields(UnknownType))

/** Transaction schema. */
export const Transaction = z.union([
  Legacy,
  Eip2930,
  Eip1559,
  Eip4844,
  Eip7702,
  Unknown,
])

/** Pending transaction schema. */
export const Pending = z.union([
  PendingLegacy,
  PendingEip2930,
  PendingEip1559,
  PendingEip4844,
  PendingEip7702,
  PendingUnknown,
])

function type<input extends string, output extends string>(
  input: input,
  output: output,
) {
  return z.codec(z.literal(input), z.literal(output), {
    decode: () => output,
    encode: () => input,
  })
}

function baseFields<const schema extends z.ZodMiniType<string, string>>(
  type: schema,
) {
  return {
    ...commonFields(type),
    chainId: z_Number.Number,
    yParity: z_Number.Number,
  }
}

function pendingBaseFields<const schema extends z.ZodMiniType<string, string>>(
  type: schema,
) {
  return {
    ...pendingCommonFields(type),
    chainId: z_Number.Number,
    yParity: z_Number.Number,
  }
}

function legacyFields<const schema extends z.ZodMiniType<string, string>>(
  type: schema,
) {
  return {
    ...commonFields(type),
    chainId: z.optional(z_Number.Number),
    gasPrice: z_Uint.Uint,
    v: z_Number.Number,
    yParity: z.optional(z_Number.Number),
  }
}

function pendingLegacyFields<
  const schema extends z.ZodMiniType<string, string>,
>(type: schema) {
  return {
    ...pendingCommonFields(type),
    chainId: z.optional(z_Number.Number),
    gasPrice: z_Uint.Uint,
    v: z_Number.Number,
    yParity: z.optional(z_Number.Number),
  }
}

function commonFields<const schema extends z.ZodMiniType<string, string>>(
  type: schema,
) {
  return {
    blockHash: z_Hex.Hex,
    blockNumber: z_Uint.Uint,
    blockTimestamp: z.optional(z_Uint.Uint),
    data: z.optional(z_Hex.Hex),
    from: z_Address.Address,
    gas: z_Uint.Uint,
    hash: z_Hex.Hex,
    input: z_Hex.Hex,
    nonce: z_Uint.Uint,
    to: z.union([z_Address.Address, z.null()]),
    transactionIndex: z_Number.Number,
    type,
    value: z_Uint.Uint,
    r: z_Hex.Hex,
    s: z_Hex.Hex,
    v: z.optional(z_Number.Number),
  }
}

function pendingCommonFields<
  const schema extends z.ZodMiniType<string, string>,
>(type: schema) {
  return {
    blockHash: z.null(),
    blockNumber: z.null(),
    blockTimestamp: z.optional(z.null()),
    data: z.optional(z_Hex.Hex),
    from: z_Address.Address,
    gas: z_Uint.Uint,
    hash: z_Hex.Hex,
    input: z_Hex.Hex,
    nonce: z_Uint.Uint,
    to: z.union([z_Address.Address, z.null()]),
    transactionIndex: z.null(),
    type,
    value: z_Uint.Uint,
    r: z_Hex.Hex,
    s: z_Hex.Hex,
    v: z.optional(z_Number.Number),
  }
}
