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
export const Base = z.object(baseFields(Type, z_Uint.Uint, z_Number.Number))

/** Pending base transaction schema. */
export const PendingBase = z.object(
  pendingBaseFields(Type, z_Uint.Uint, z_Number.Number),
)

/** Legacy transaction schema. */
export const Legacy = z.object(
  legacyFields(LegacyType, z_Uint.Uint, z_Number.Number),
)
/** Encode-only legacy transaction schema accepting numberish `toRpc` inputs. */
export const LegacyToRpc = z.object(
  legacyFields(LegacyType, z_Uint.UintToRpc, z_Number.NumberToRpc),
)

/** Pending legacy transaction schema. */
export const PendingLegacy = z.object(
  pendingLegacyFields(LegacyType, z_Uint.Uint, z_Number.Number),
)

/** EIP-1559 transaction schema. */
export const Eip1559 = z.object(
  eip1559Fields(Eip1559Type, z_Uint.Uint, z_Number.Number),
)
/** Encode-only EIP-1559 transaction schema accepting numberish `toRpc` inputs. */
export const Eip1559ToRpc = z.object(
  eip1559Fields(Eip1559Type, z_Uint.UintToRpc, z_Number.NumberToRpc),
)

/** Pending EIP-1559 transaction schema. */
export const PendingEip1559 = z.object(
  pendingEip1559Fields(Eip1559Type, z_Uint.Uint, z_Number.Number),
)

/** EIP-2930 transaction schema. */
export const Eip2930 = z.object(
  eip2930Fields(Eip2930Type, z_Uint.Uint, z_Number.Number),
)
/** Encode-only EIP-2930 transaction schema accepting numberish `toRpc` inputs. */
export const Eip2930ToRpc = z.object(
  eip2930Fields(Eip2930Type, z_Uint.UintToRpc, z_Number.NumberToRpc),
)

/** Pending EIP-2930 transaction schema. */
export const PendingEip2930 = z.object(
  pendingEip2930Fields(Eip2930Type, z_Uint.Uint, z_Number.Number),
)

/** EIP-4844 transaction schema. */
export const Eip4844 = z.object(
  eip4844Fields(Eip4844Type, z_Uint.Uint, z_Number.Number),
)
/** Encode-only EIP-4844 transaction schema accepting numberish `toRpc` inputs. */
export const Eip4844ToRpc = z.object(
  eip4844Fields(Eip4844Type, z_Uint.UintToRpc, z_Number.NumberToRpc),
)

/** Pending EIP-4844 transaction schema. */
export const PendingEip4844 = z.object(
  pendingEip4844Fields(Eip4844Type, z_Uint.Uint, z_Number.Number),
)

/** EIP-7702 transaction schema. */
export const Eip7702 = z.object(
  eip7702Fields(
    Eip7702Type,
    z_Uint.Uint,
    z_Number.Number,
    z_Authorization.ListSigned,
  ),
)
/** Encode-only EIP-7702 transaction schema accepting numberish `toRpc` inputs. */
export const Eip7702ToRpc = z.object(
  eip7702Fields(
    Eip7702Type,
    z_Uint.UintToRpc,
    z_Number.NumberToRpc,
    z_Authorization.ListSignedToRpc,
  ),
)

/** Pending EIP-7702 transaction schema. */
export const PendingEip7702 = z.object(
  pendingEip7702Fields(
    Eip7702Type,
    z_Uint.Uint,
    z_Number.Number,
    z_Authorization.ListSigned,
  ),
)

/** Unknown typed transaction schema. */
export const Unknown = z.object(
  baseFields(UnknownType, z_Uint.Uint, z_Number.Number),
)
/** Encode-only unknown typed transaction schema accepting numberish `toRpc` inputs. */
export const UnknownToRpc = z.object(
  baseFields(UnknownType, z_Uint.UintToRpc, z_Number.NumberToRpc),
)

/** Pending unknown typed transaction schema. */
export const PendingUnknown = z.object(
  pendingBaseFields(UnknownType, z_Uint.Uint, z_Number.Number),
)

/** Transaction schema. */
export const Transaction = z.union([
  Legacy,
  Eip2930,
  Eip1559,
  Eip4844,
  Eip7702,
  Unknown,
])

/** Encode-only transaction schema accepting numberish `toRpc` inputs. */
export const TransactionToRpc = z.union([
  LegacyToRpc,
  Eip2930ToRpc,
  Eip1559ToRpc,
  Eip4844ToRpc,
  Eip7702ToRpc,
  UnknownToRpc,
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

function eip1559Fields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...baseFields(type, uint, num),
    accessList: z_AccessList.AccessList,
    gasPrice: z.optional(uint),
    maxFeePerGas: uint,
    maxPriorityFeePerGas: uint,
  }
}

function pendingEip1559Fields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...pendingBaseFields(type, uint, num),
    accessList: z_AccessList.AccessList,
    gasPrice: z.optional(uint),
    maxFeePerGas: uint,
    maxPriorityFeePerGas: uint,
  }
}

function eip2930Fields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...baseFields(type, uint, num),
    accessList: z_AccessList.AccessList,
    gasPrice: uint,
  }
}

function pendingEip2930Fields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...pendingBaseFields(type, uint, num),
    accessList: z_AccessList.AccessList,
    gasPrice: uint,
  }
}

function eip4844Fields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...baseFields(type, uint, num),
    accessList: z_AccessList.AccessList,
    blobVersionedHashes: z.readonly(z.array(z_Hex.Hex)),
    maxFeePerBlobGas: uint,
    maxFeePerGas: uint,
    maxPriorityFeePerGas: uint,
  }
}

function pendingEip4844Fields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...pendingBaseFields(type, uint, num),
    accessList: z_AccessList.AccessList,
    blobVersionedHashes: z.readonly(z.array(z_Hex.Hex)),
    maxFeePerBlobGas: uint,
    maxFeePerGas: uint,
    maxPriorityFeePerGas: uint,
  }
}

function eip7702Fields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
  authorizationList extends z.ZodMiniType,
>(type: schema, uint: uint, num: num, authorizationList: authorizationList) {
  return {
    ...baseFields(type, uint, num),
    accessList: z_AccessList.AccessList,
    authorizationList,
    maxFeePerGas: uint,
    maxPriorityFeePerGas: uint,
  }
}

function pendingEip7702Fields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
  authorizationList extends z.ZodMiniType,
>(type: schema, uint: uint, num: num, authorizationList: authorizationList) {
  return {
    ...pendingBaseFields(type, uint, num),
    accessList: z_AccessList.AccessList,
    authorizationList,
    maxFeePerGas: uint,
    maxPriorityFeePerGas: uint,
  }
}

function baseFields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...commonFields(type, uint, num),
    chainId: num,
    yParity: num,
  }
}

function pendingBaseFields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...pendingCommonFields(type, uint, num),
    chainId: num,
    yParity: num,
  }
}

function legacyFields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...commonFields(type, uint, num),
    chainId: z.optional(num),
    gasPrice: uint,
    v: num,
    yParity: z.optional(num),
  }
}

function pendingLegacyFields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    ...pendingCommonFields(type, uint, num),
    chainId: z.optional(num),
    gasPrice: uint,
    v: num,
    yParity: z.optional(num),
  }
}

function commonFields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    blockHash: z_Hex.Hex,
    blockNumber: uint,
    blockTimestamp: z.optional(uint),
    data: z.optional(z_Hex.Hex),
    from: z_Address.Address,
    gas: uint,
    hash: z_Hex.Hex,
    input: z_Hex.Hex,
    nonce: uint,
    to: z.union([z_Address.Address, z.null()]),
    transactionIndex: num,
    type,
    value: uint,
    r: z_Hex.Hex,
    s: z_Hex.Hex,
    v: z.optional(num),
  }
}

function pendingCommonFields<
  const schema extends z.ZodMiniType<string, string>,
  uint extends z.ZodMiniType,
  num extends z.ZodMiniType,
>(type: schema, uint: uint, num: num) {
  return {
    blockHash: z.null(),
    blockNumber: z.null(),
    blockTimestamp: z.optional(z.null()),
    data: z.optional(z_Hex.Hex),
    from: z_Address.Address,
    gas: uint,
    hash: z_Hex.Hex,
    input: z_Hex.Hex,
    nonce: uint,
    to: z.union([z_Address.Address, z.null()]),
    transactionIndex: z.null(),
    type,
    value: uint,
    r: z_Hex.Hex,
    s: z_Hex.Hex,
    v: z.optional(num),
  }
}
