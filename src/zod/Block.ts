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
export const Block = z.object(
  blockFields(
    z.readonly(z.array(z_Hex.Hex)),
    z_Uint.Uint,
    z_Withdrawal.Withdrawal,
  ),
)

/** Encode-only block schema (transaction hashes) accepting numberish `toRpc` inputs. */
export const BlockToRpc = z.object(
  blockFields(
    z.readonly(z.array(z_Hex.Hex)),
    z_Uint.UintToRpc,
    z_Withdrawal.WithdrawalToRpc,
  ),
)

/** Block schema with full transactions. */
export const WithTransactions = z.object(
  blockFields(
    z.readonly(z.array(z_Transaction.Transaction)),
    z_Uint.Uint,
    z_Withdrawal.Withdrawal,
  ),
)

/** Encode-only block schema (full transactions) accepting numberish `toRpc` inputs. */
export const WithTransactionsToRpc = z.object(
  blockFields(
    z.readonly(z.array(z_Transaction.TransactionToRpc)),
    z_Uint.UintToRpc,
    z_Withdrawal.WithdrawalToRpc,
  ),
)

/** Pending block schema with transaction hashes. */
export const Pending = z.object(
  pendingBlockFields(
    z.readonly(z.array(z_Hex.Hex)),
    z_Uint.Uint,
    z_Withdrawal.Withdrawal,
  ),
)

/** Pending block schema with full transactions. */
export const PendingWithTransactions = z.object(
  pendingBlockFields(
    z.readonly(z.array(z_Transaction.Pending)),
    z_Uint.Uint,
    z_Withdrawal.Withdrawal,
  ),
)

function blockFields<
  const transactions extends z.ZodMiniType,
  uint extends z.ZodMiniType,
  withdrawal extends z.ZodMiniType,
>(transactions: transactions, uint: uint, withdrawal: withdrawal) {
  return {
    ...commonFields(transactions, uint, withdrawal),
    hash: z_Hex.Hex,
    logsBloom: z_Hex.Hex,
    nonce: z_Hex.Hex,
    number: uint,
  }
}

function pendingBlockFields<
  const transactions extends z.ZodMiniType,
  uint extends z.ZodMiniType,
  withdrawal extends z.ZodMiniType,
>(transactions: transactions, uint: uint, withdrawal: withdrawal) {
  return {
    ...commonFields(transactions, uint, withdrawal),
    hash: z.null(),
    logsBloom: z.null(),
    nonce: z.null(),
    number: z.null(),
  }
}

function commonFields<
  const transactions extends z.ZodMiniType,
  uint extends z.ZodMiniType,
  withdrawal extends z.ZodMiniType,
>(transactions: transactions, uint: uint, withdrawal: withdrawal) {
  return {
    baseFeePerGas: z.optional(uint),
    blobGasUsed: z.optional(uint),
    difficulty: z.optional(uint),
    excessBlobGas: z.optional(uint),
    extraData: z.optional(z_Hex.Hex),
    gasLimit: uint,
    gasUsed: uint,
    miner: z_Address.Address,
    mixHash: z_Hex.Hex,
    parentBeaconBlockRoot: z.optional(z_Hex.Hex),
    parentHash: z_Hex.Hex,
    receiptsRoot: z_Hex.Hex,
    sealFields: z.optional(z.readonly(z.array(z_Hex.Hex))),
    sha3Uncles: z_Hex.Hex,
    size: uint,
    stateRoot: z_Hex.Hex,
    timestamp: uint,
    totalDifficulty: z.optional(uint),
    transactions,
    transactionsRoot: z_Hex.Hex,
    uncles: z.readonly(z.array(z_Hex.Hex)),
    withdrawals: z.optional(z.readonly(z.array(withdrawal))),
    withdrawalsRoot: z.optional(z_Hex.Hex),
  }
}
