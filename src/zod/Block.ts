/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from './Address.js'
import * as z_Hex from './Hex.js'
import * as z_Transaction from './Transaction.js'
import * as z_Uint from './Uint.js'
import * as z_Withdrawal from './Withdrawal.js'
import * as z from 'zod/mini'

/** Block hash schema. */
export const Hash = z_Hex.Hex

/** Block number schema. */
export const Number = z_Uint.Uint

/** Block tag schema. */
export const Tag = z.union([
  z.literal('latest'),
  z.literal('earliest'),
  z.literal('pending'),
  z.literal('safe'),
  z.literal('finalized'),
])

/** Block identifier schema. */
export const Identifier = z.union([
  z.object({
    blockNumber: Number,
    blockHash: z.optional(z.undefined()),
    requireCanonical: z.optional(z.boolean()),
  }),
  z.object({
    blockHash: Hash,
    blockNumber: z.optional(z.undefined()),
    requireCanonical: z.optional(z.boolean()),
  }),
])

/** Block schema with transaction hashes. */
export const Block = z.object(blockFields(z.readonly(z.array(z_Hex.Hex))))

/** Block schema with full transactions. */
export const WithTransactions = z.object(
  blockFields(z.readonly(z.array(z_Transaction.Transaction))),
)

/** Pending block schema with transaction hashes. */
export const Pending = z.object(
  pendingBlockFields(z.readonly(z.array(z_Hex.Hex))),
)

/** Pending block schema with full transactions. */
export const PendingWithTransactions = z.object(
  pendingBlockFields(z.readonly(z.array(z_Transaction.Pending))),
)

function blockFields<const transactions extends z.ZodMiniType>(
  transactions: transactions,
) {
  return {
    ...commonFields(transactions),
    hash: z_Hex.Hex,
    logsBloom: z_Hex.Hex,
    nonce: z_Hex.Hex,
    number: Number,
  }
}

function pendingBlockFields<const transactions extends z.ZodMiniType>(
  transactions: transactions,
) {
  return {
    ...commonFields(transactions),
    hash: z.null(),
    logsBloom: z.null(),
    nonce: z.null(),
    number: z.null(),
  }
}

function commonFields<const transactions extends z.ZodMiniType>(
  transactions: transactions,
) {
  return {
    baseFeePerGas: z.optional(z_Uint.Uint),
    blobGasUsed: z.optional(z_Uint.Uint),
    difficulty: z.optional(z_Uint.Uint),
    excessBlobGas: z.optional(z_Uint.Uint),
    extraData: z.optional(z_Hex.Hex),
    gasLimit: z_Uint.Uint,
    gasUsed: z_Uint.Uint,
    miner: z_Address.Address,
    mixHash: z_Hex.Hex,
    parentBeaconBlockRoot: z.optional(z_Hex.Hex),
    parentHash: z_Hex.Hex,
    receiptsRoot: z_Hex.Hex,
    sealFields: z.optional(z.readonly(z.array(z_Hex.Hex))),
    sha3Uncles: z_Hex.Hex,
    size: z_Uint.Uint,
    stateRoot: z_Hex.Hex,
    timestamp: z_Uint.Uint,
    totalDifficulty: z.optional(z_Uint.Uint),
    transactions,
    transactionsRoot: z_Hex.Hex,
    uncles: z.readonly(z.array(z_Hex.Hex)),
    withdrawals: z.optional(z.readonly(z.array(z_Withdrawal.Withdrawal))),
    withdrawalsRoot: z.optional(z_Hex.Hex),
  }
}
