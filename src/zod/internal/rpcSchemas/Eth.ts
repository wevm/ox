/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccountProof from '../../AccountProof.js'
import * as z_Address from '../../Address.js'
import * as z_Block from '../../Block.js'
import * as z_BlockOverrides from '../../BlockOverrides.js'
import * as z_Fee from '../../Fee.js'
import * as z_Filter from '../../Filter.js'
import * as z_Hex from '../../Hex.js'
import * as z_Log from '../../Log.js'
import * as z_Number from '../../Number.js'
import * as z_StateOverrides from '../../StateOverrides.js'
import * as z_Transaction from '../../Transaction.js'
import * as z_TransactionReceipt from '../../TransactionReceipt.js'
import * as z_TransactionRequest from '../../TransactionRequest.js'
import * as z_Uint from '../../Uint.js'
import * as z from 'zod/mini'
import { from } from './from.js'

const NoParams = z.optional(z.tuple([]))

/** Block number (hex) or block tag. */
const BlockNumberOrTag = z.union([z_Block.Number, z_Block.Tag])

/** Block number (hex), block tag, or block identifier. */
const BlockNumberOrTagOrIdentifier = z.union([
  z_Block.Number,
  z_Block.Tag,
  z_Block.Identifier,
])

/** A block in any of its wire forms. */
const Block = z.union([
  z_Block.Block,
  z_Block.WithTransactions,
  z_Block.Pending,
  z_Block.PendingWithTransactions,
])

/** A transaction in any of its wire forms. */
const Transaction = z.union([z_Transaction.Transaction, z_Transaction.Pending])

/** Call request shape shared by `eth_call` / `eth_estimateGas`. */
const Call = z.union([
  z.tuple([z_TransactionRequest.TransactionRequest]),
  z.tuple([
    z_TransactionRequest.TransactionRequest,
    BlockNumberOrTagOrIdentifier,
  ]),
  z.tuple([
    z_TransactionRequest.TransactionRequest,
    BlockNumberOrTagOrIdentifier,
    z_StateOverrides.StateOverrides,
  ]),
])

export const eth_accounts = from({
  method: 'eth_accounts',
  params: NoParams,
  returns: z.array(z_Address.Address),
})

export const eth_blobBaseFee = from({
  method: 'eth_blobBaseFee',
  params: NoParams,
  returns: z_Uint.Uint,
})

export const eth_blockNumber = from({
  method: 'eth_blockNumber',
  params: NoParams,
  returns: z_Uint.Uint,
})

export const eth_call = from({
  method: 'eth_call',
  params: Call,
  returns: z_Hex.Hex,
})

export const eth_chainId = from({
  method: 'eth_chainId',
  params: NoParams,
  returns: z_Number.Number,
})

export const eth_coinbase = from({
  method: 'eth_coinbase',
  params: NoParams,
  returns: z_Address.Address,
})

export const eth_estimateGas = from({
  method: 'eth_estimateGas',
  params: Call,
  returns: z_Uint.Uint,
})

export const eth_feeHistory = from({
  method: 'eth_feeHistory',
  params: z.tuple([
    z_Hex.Hex,
    BlockNumberOrTag,
    z.union([z.array(z.number()), z.undefined()]),
  ]),
  returns: z_Fee.FeeHistory,
})

export const eth_gasPrice = from({
  method: 'eth_gasPrice',
  params: NoParams,
  returns: z_Uint.Uint,
})

export const eth_getBalance = from({
  method: 'eth_getBalance',
  params: z.tuple([z_Address.Address, BlockNumberOrTagOrIdentifier]),
  returns: z_Uint.Uint,
})

export const eth_getBlockByHash = from({
  method: 'eth_getBlockByHash',
  params: z.tuple([z_Hex.Hex, z.boolean()]),
  returns: z.nullable(Block),
})

export const eth_getBlockByNumber = from({
  method: 'eth_getBlockByNumber',
  params: z.tuple([BlockNumberOrTag, z.boolean()]),
  returns: z.nullable(Block),
})

export const eth_getBlockTransactionCountByHash = from({
  method: 'eth_getBlockTransactionCountByHash',
  params: z.tuple([z_Hex.Hex]),
  returns: z_Number.Number,
})

export const eth_getBlockTransactionCountByNumber = from({
  method: 'eth_getBlockTransactionCountByNumber',
  params: z.tuple([BlockNumberOrTag]),
  returns: z_Number.Number,
})

export const eth_getCode = from({
  method: 'eth_getCode',
  params: z.tuple([z_Address.Address, BlockNumberOrTagOrIdentifier]),
  returns: z_Hex.Hex,
})

export const eth_getFilterChanges = from({
  method: 'eth_getFilterChanges',
  params: z.tuple([z_Hex.Hex]),
  returns: z.union([z.array(z_Log.Log), z.array(z_Hex.Hex)]),
})

export const eth_getFilterLogs = from({
  method: 'eth_getFilterLogs',
  params: z.tuple([z_Hex.Hex]),
  returns: z.array(z_Log.Log),
})

export const eth_getLogs = from({
  method: 'eth_getLogs',
  params: z.tuple([z_Filter.Filter]),
  returns: z.array(z_Log.Log),
})

export const eth_getProof = from({
  method: 'eth_getProof',
  params: z.tuple([
    z_Address.Address,
    z.array(z_Hex.Hex),
    BlockNumberOrTagOrIdentifier,
  ]),
  returns: z_AccountProof.AccountProof,
})

export const eth_getStorageAt = from({
  method: 'eth_getStorageAt',
  params: z.tuple([z_Address.Address, z_Hex.Hex, BlockNumberOrTagOrIdentifier]),
  returns: z_Hex.Hex,
})

export const eth_getTransactionByBlockHashAndIndex = from({
  method: 'eth_getTransactionByBlockHashAndIndex',
  params: z.tuple([z_Hex.Hex, z_Hex.Hex]),
  returns: z.nullable(Transaction),
})

export const eth_getTransactionByBlockNumberAndIndex = from({
  method: 'eth_getTransactionByBlockNumberAndIndex',
  params: z.tuple([BlockNumberOrTag, z_Hex.Hex]),
  returns: z.nullable(Transaction),
})

export const eth_getTransactionByHash = from({
  method: 'eth_getTransactionByHash',
  params: z.tuple([z_Hex.Hex]),
  returns: z.nullable(Transaction),
})

export const eth_getTransactionCount = from({
  method: 'eth_getTransactionCount',
  params: z.tuple([z_Address.Address, BlockNumberOrTagOrIdentifier]),
  returns: z_Number.Number,
})

export const eth_getTransactionReceipt = from({
  method: 'eth_getTransactionReceipt',
  params: z.tuple([z_Hex.Hex]),
  returns: z.nullable(z_TransactionReceipt.TransactionReceipt),
})

export const eth_getUncleCountByBlockHash = from({
  method: 'eth_getUncleCountByBlockHash',
  params: z.tuple([z_Hex.Hex]),
  returns: z_Number.Number,
})

export const eth_getUncleCountByBlockNumber = from({
  method: 'eth_getUncleCountByBlockNumber',
  params: z.tuple([BlockNumberOrTag]),
  returns: z_Number.Number,
})

export const eth_maxPriorityFeePerGas = from({
  method: 'eth_maxPriorityFeePerGas',
  params: NoParams,
  returns: z_Uint.Uint,
})

export const eth_newBlockFilter = from({
  method: 'eth_newBlockFilter',
  params: NoParams,
  returns: z_Hex.Hex,
})

export const eth_newFilter = from({
  method: 'eth_newFilter',
  params: z.tuple([z_Filter.Filter]),
  returns: z_Hex.Hex,
})

export const eth_newPendingTransactionFilter = from({
  method: 'eth_newPendingTransactionFilter',
  params: NoParams,
  returns: z_Hex.Hex,
})

export const eth_protocolVersion = from({
  method: 'eth_protocolVersion',
  params: NoParams,
  returns: z.string(),
})

export const eth_requestAccounts = from({
  method: 'eth_requestAccounts',
  params: NoParams,
  returns: z.array(z_Address.Address),
})

export const eth_sendRawTransaction = from({
  method: 'eth_sendRawTransaction',
  params: z.tuple([z_Hex.Hex]),
  returns: z_Hex.Hex,
})

export const eth_sendRawTransactionSync = from({
  method: 'eth_sendRawTransactionSync',
  params: z.union([z.tuple([z_Hex.Hex]), z.tuple([z_Hex.Hex, z.number()])]),
  returns: z_TransactionReceipt.TransactionReceipt,
})

export const eth_sendTransaction = from({
  method: 'eth_sendTransaction',
  params: z.tuple([z_TransactionRequest.TransactionRequest]),
  returns: z_Hex.Hex,
})

export const eth_simulateV1 = from({
  method: 'eth_simulateV1',
  params: z.tuple([
    z.object({
      blockStateCalls: z.array(
        z.object({
          blockOverrides: z.optional(z_BlockOverrides.BlockOverrides),
          calls: z.optional(z.array(z_TransactionRequest.TransactionRequest)),
          stateOverrides: z.optional(z_StateOverrides.StateOverrides),
        }),
      ),
      returnFullTransactions: z.optional(z.boolean()),
      traceTransfers: z.optional(z.boolean()),
      validation: z.optional(z.boolean()),
    }),
    BlockNumberOrTagOrIdentifier,
  ]),
  returns: z.array(
    z.intersection(
      Block,
      z.object({
        calls: z.optional(
          z.array(
            z.object({
              error: z.optional(
                z.object({
                  data: z.optional(z_Hex.Hex),
                  code: z.number(),
                  message: z.string(),
                }),
              ),
              logs: z.optional(z.array(z_Log.Log)),
              gasUsed: z_Hex.Hex,
              returnData: z_Hex.Hex,
              status: z_Hex.Hex,
            }),
          ),
        ),
      }),
    ),
  ),
})

export const eth_signTransaction = from({
  method: 'eth_signTransaction',
  params: z.tuple([z_TransactionRequest.TransactionRequest]),
  returns: z_Hex.Hex,
})

export const eth_signTypedData_v4 = from({
  method: 'eth_signTypedData_v4',
  params: z.tuple([z_Address.Address, z.string()]),
  returns: z_Hex.Hex,
})

export const eth_uninstallFilter = from({
  method: 'eth_uninstallFilter',
  params: z.tuple([z_Hex.Hex]),
  returns: z.boolean(),
})
