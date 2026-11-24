/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_AccountProof from '../../AccountProof.js'
import * as z_Address from '../../Address.js'
import * as z_Block from '../../Block.js'
import * as z_BlockOverrides from '../../BlockOverrides.js'
import * as z_Fee from '../../Fee.js'
import * as z_Filter from '../../Filter.js'
import * as z_FrameReceipt from '../../FrameReceipt.js'
import * as z_Hex from '../../Hex.js'
import * as z_Log from '../../Log.js'
import * as z_Number from '../../Number.js'
import * as z_StateOverrides from '../../StateOverrides.js'
import * as z_Transaction from '../../Transaction.js'
import * as z_TransactionReceipt from '../../TransactionReceipt.js'
import * as z_TransactionRequest from '../../TransactionRequest.js'
import * as z_Uint from '../../Uint.js'
import * as z from 'zod/mini'
import * as Frame from '../Frame.js'
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
  /* @__PURE__ */ z.tuple([z_TransactionRequest.TransactionRequestToRpc]),
  /* @__PURE__ */ z.tuple([
    z_TransactionRequest.TransactionRequestToRpc,
    BlockNumberOrTagOrIdentifier,
  ]),
  /* @__PURE__ */ z.tuple([
    z_TransactionRequest.TransactionRequestToRpc,
    BlockNumberOrTagOrIdentifier,
    z_StateOverrides.StateOverrides,
  ]),
  /* @__PURE__ */ z.tuple([
    z_TransactionRequest.TransactionRequestToRpc,
    BlockNumberOrTagOrIdentifier,
    z_StateOverrides.StateOverrides,
    z_BlockOverrides.BlockOverrides,
  ]),
])

export const eth_accounts = from({
  method: 'eth_accounts',
  params: NoParams,
  returns: /* @__PURE__ */ z.array(z_Address.Address),
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
  params: /* @__PURE__ */ z.tuple([
    z_Hex.Hex,
    BlockNumberOrTag,
    /* @__PURE__ */ z.union([
      /* @__PURE__ */ z.array(/* @__PURE__ */ z.number()),
      /* @__PURE__ */ z.undefined(),
    ]),
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
  params: /* @__PURE__ */ z.tuple([
    z_Address.Address,
    BlockNumberOrTagOrIdentifier,
  ]),
  returns: z_Uint.Uint,
})

export const eth_getBlockByHash = from({
  method: 'eth_getBlockByHash',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex, /* @__PURE__ */ z.boolean()]),
  returns: /* @__PURE__ */ z.nullable(Block),
})

export const eth_getBlockByNumber = from({
  method: 'eth_getBlockByNumber',
  params: /* @__PURE__ */ z.tuple([
    BlockNumberOrTag,
    /* @__PURE__ */ z.boolean(),
  ]),
  returns: /* @__PURE__ */ z.nullable(Block),
})

export const eth_getBlockTransactionCountByHash = from({
  method: 'eth_getBlockTransactionCountByHash',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: z_Number.Number,
})

export const eth_getBlockTransactionCountByNumber = from({
  method: 'eth_getBlockTransactionCountByNumber',
  params: /* @__PURE__ */ z.tuple([BlockNumberOrTag]),
  returns: z_Number.Number,
})

export const eth_getCode = from({
  method: 'eth_getCode',
  params: /* @__PURE__ */ z.tuple([
    z_Address.Address,
    BlockNumberOrTagOrIdentifier,
  ]),
  returns: z_Hex.Hex,
})

export const eth_getFilterChanges = from({
  method: 'eth_getFilterChanges',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: /* @__PURE__ */ z.union([
    /* @__PURE__ */ z.array(z_Log.Log),
    /* @__PURE__ */ z.array(z_Hex.Hex),
  ]),
})

export const eth_getFilterLogs = from({
  method: 'eth_getFilterLogs',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: /* @__PURE__ */ z.array(z_Log.Log),
})

export const eth_getLogs = from({
  method: 'eth_getLogs',
  params: /* @__PURE__ */ z.tuple([z_Filter.Filter]),
  returns: /* @__PURE__ */ z.array(z_Log.Log),
})

export const eth_getProof = from({
  method: 'eth_getProof',
  params: /* @__PURE__ */ z.tuple([
    z_Address.Address,
    /* @__PURE__ */ z.array(z_Hex.Hex),
    BlockNumberOrTagOrIdentifier,
  ]),
  returns: z_AccountProof.AccountProof,
})

export const eth_getRawTransactionByHash = from({
  method: 'eth_getRawTransactionByHash',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: /* @__PURE__ */ z.nullable(z_Hex.Hex),
})

export const eth_getStorageAt = from({
  method: 'eth_getStorageAt',
  params: /* @__PURE__ */ z.tuple([
    z_Address.Address,
    z_Hex.Hex,
    BlockNumberOrTagOrIdentifier,
  ]),
  returns: z_Hex.Hex,
})

export const eth_getTransactionByBlockHashAndIndex = from({
  method: 'eth_getTransactionByBlockHashAndIndex',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex, z_Hex.Hex]),
  returns: /* @__PURE__ */ z.nullable(Transaction),
})

export const eth_getTransactionByBlockNumberAndIndex = from({
  method: 'eth_getTransactionByBlockNumberAndIndex',
  params: /* @__PURE__ */ z.tuple([BlockNumberOrTag, z_Hex.Hex]),
  returns: /* @__PURE__ */ z.nullable(Transaction),
})

export const eth_getTransactionByHash = from({
  method: 'eth_getTransactionByHash',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: /* @__PURE__ */ z.nullable(Transaction),
})

export const eth_getTransactionCount = from({
  method: 'eth_getTransactionCount',
  params: /* @__PURE__ */ z.tuple([
    z_Address.Address,
    BlockNumberOrTagOrIdentifier,
    /* @__PURE__ */ z.optional(Frame.nonceKeysToRpc),
  ]),
  returns: z_Number.Number,
})

export const eth_getTransactionReceipt = from({
  method: 'eth_getTransactionReceipt',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: /* @__PURE__ */ z.nullable(z_TransactionReceipt.TransactionReceipt),
})

export const eth_getUncleCountByBlockHash = from({
  method: 'eth_getUncleCountByBlockHash',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: z_Number.Number,
})

export const eth_getUncleCountByBlockNumber = from({
  method: 'eth_getUncleCountByBlockNumber',
  params: /* @__PURE__ */ z.tuple([BlockNumberOrTag]),
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
  params: /* @__PURE__ */ z.tuple([z_Filter.Filter]),
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
  returns: /* @__PURE__ */ z.string(),
})

export const eth_requestAccounts = from({
  method: 'eth_requestAccounts',
  params: NoParams,
  returns: /* @__PURE__ */ z.array(z_Address.Address),
})

export const eth_sendRawTransaction = from({
  method: 'eth_sendRawTransaction',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: z_Hex.Hex,
})

export const eth_sendRawTransactionSync = from({
  method: 'eth_sendRawTransactionSync',
  params: /* @__PURE__ */ z.union([
    /* @__PURE__ */ z.tuple([z_Hex.Hex]),
    /* @__PURE__ */ z.tuple([z_Hex.Hex, /* @__PURE__ */ z.number()]),
  ]),
  returns: z_TransactionReceipt.TransactionReceipt,
})

export const eth_sendTransaction = from({
  method: 'eth_sendTransaction',
  params: /* @__PURE__ */ z.tuple([
    z_TransactionRequest.TransactionRequestToRpc,
  ]),
  returns: z_Hex.Hex,
})

export const eth_simulateV1 = from({
  method: 'eth_simulateV1',
  params: /* @__PURE__ */ z.tuple([
    /* @__PURE__ */ z.object({
      blockStateCalls: /* @__PURE__ */ z.array(
        /* @__PURE__ */ z.object({
          blockOverrides: /* @__PURE__ */ z.optional(
            z_BlockOverrides.BlockOverrides,
          ),
          calls: /* @__PURE__ */ z.optional(
            /* @__PURE__ */ z.array(
              z_TransactionRequest.TransactionRequestToRpc,
            ),
          ),
          stateOverrides: /* @__PURE__ */ z.optional(
            z_StateOverrides.StateOverrides,
          ),
        }),
      ),
      returnFullTransactions: /* @__PURE__ */ z.optional(
        /* @__PURE__ */ z.boolean(),
      ),
      traceTransfers: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.boolean()),
      validation: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.boolean()),
    }),
    BlockNumberOrTagOrIdentifier,
  ]),
  returns: /* @__PURE__ */ z.array(
    /* @__PURE__ */ z.intersection(
      Block,
      /* @__PURE__ */ z.object({
        calls: /* @__PURE__ */ z.optional(
          /* @__PURE__ */ z.array(
            /* @__PURE__ */ z.object({
              error: /* @__PURE__ */ z.optional(
                /* @__PURE__ */ z.object({
                  data: /* @__PURE__ */ z.optional(z_Hex.Hex),
                  code: /* @__PURE__ */ z.number(),
                  message: /* @__PURE__ */ z.string(),
                }),
              ),
              frameResults: /* @__PURE__ */ z.optional(
                /* @__PURE__ */ z.readonly(
                  /* @__PURE__ */ z.array(
                    /* @__PURE__ */ z.intersection(
                      z_FrameReceipt.FrameReceipt,
                      /* @__PURE__ */ z.object({
                        error: /* @__PURE__ */ z.optional(
                          /* @__PURE__ */ z.object({
                            code: /* @__PURE__ */ z.number(),
                            message: /* @__PURE__ */ z.string(),
                          }),
                        ),
                        returnData: z_Hex.Hex,
                      }),
                    ),
                  ),
                ),
              ),
              payer: /* @__PURE__ */ z.optional(z_Address.Address),
              logs: /* @__PURE__ */ z.optional(
                /* @__PURE__ */ z.array(z_Log.Log),
              ),
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
  params: /* @__PURE__ */ z.tuple([
    z_TransactionRequest.TransactionRequestToRpc,
  ]),
  returns: z_Hex.Hex,
})

export const eth_signTypedData_v4 = from({
  method: 'eth_signTypedData_v4',
  params: /* @__PURE__ */ z.tuple([
    z_Address.Address,
    /* @__PURE__ */ z.string(),
  ]),
  returns: z_Hex.Hex,
})

export const eth_uninstallFilter = from({
  method: 'eth_uninstallFilter',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: /* @__PURE__ */ z.boolean(),
})
