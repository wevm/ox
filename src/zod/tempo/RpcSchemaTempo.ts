/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Address from '../Address.js'
import * as z_Block from '../Block.js'
import * as z_BlockOverrides from '../BlockOverrides.js'
import * as z_Hex from '../Hex.js'
import * as z_Log from '../Log.js'
import * as z_StateOverrides from '../StateOverrides.js'
import { from } from '../internal/rpcSchemas/from.js'
import * as z from 'zod/mini'
import * as z_AccountConfig from './AccountConfig.js'
import * as z_KeyAuthorization from './KeyAuthorization.js'
import * as z_AccountOperation from './AccountOperation.js'
import * as z_TransactionRequest from './TransactionRequest.js'

const BlockNumberOrTagOrIdentifier = z.union([
  z_Block.Number,
  z_Block.Tag,
  z_Block.Identifier,
])

const Block = z.union([
  z_Block.Block,
  z_Block.WithTransactions,
  z_Block.Pending,
  z_Block.PendingWithTransactions,
])

/** Schema for the `tempo_simulateV1` JSON-RPC method. */
export const tempo_simulateV1 = from({
  method: 'tempo_simulateV1',
  params: /* @__PURE__ */ z.tuple([
    /* @__PURE__ */ z.object({
      blockStateCalls: /* @__PURE__ */ z.readonly(
        /* @__PURE__ */ z.array(
          /* @__PURE__ */ z.object({
            blockOverrides: /* @__PURE__ */ z.optional(
              z_BlockOverrides.BlockOverrides,
            ),
            calls: /* @__PURE__ */ z.optional(
              /* @__PURE__ */ z.readonly(
                /* @__PURE__ */ z.array(
                  z_TransactionRequest.TransactionRequest,
                ),
              ),
            ),
            stateOverrides: /* @__PURE__ */ z.optional(
              z_StateOverrides.StateOverrides,
            ),
          }),
        ),
      ),
      returnFullTransactions: /* @__PURE__ */ z.optional(
        /* @__PURE__ */ z.boolean(),
      ),
      traceTransfers: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.boolean()),
      validation: /* @__PURE__ */ z.optional(/* @__PURE__ */ z.boolean()),
    }),
    BlockNumberOrTagOrIdentifier,
  ]),
  returns: /* @__PURE__ */ z.object({
    blocks: /* @__PURE__ */ z.readonly(
      /* @__PURE__ */ z.array(
        /* @__PURE__ */ z.intersection(
          Block,
          /* @__PURE__ */ z.object({
            calls: /* @__PURE__ */ z.optional(
              /* @__PURE__ */ z.readonly(
                /* @__PURE__ */ z.array(
                  /* @__PURE__ */ z.object({
                    error: /* @__PURE__ */ z.optional(
                      /* @__PURE__ */ z.object({
                        code: /* @__PURE__ */ z.number(),
                        data: /* @__PURE__ */ z.optional(z_Hex.Hex),
                        message: /* @__PURE__ */ z.string(),
                      }),
                    ),
                    gasUsed: z_Hex.Hex,
                    logs: /* @__PURE__ */ z.optional(
                      /* @__PURE__ */ z.readonly(
                        /* @__PURE__ */ z.array(z_Log.Log),
                      ),
                    ),
                    returnData: z_Hex.Hex,
                    status: z_Hex.Hex,
                  }),
                ),
              ),
            ),
          }),
        ),
      ),
    ),
    tokenMetadata: /* @__PURE__ */ z.record(
      z_Hex.Hex,
      /* @__PURE__ */ z.object({
        currency: /* @__PURE__ */ z.string(),
        name: /* @__PURE__ */ z.string(),
        symbol: /* @__PURE__ */ z.string(),
      }),
    ),
  }),
})

/** JSON-RPC method schemas for the `tempo_` namespace. */
export const Tempo = { tempo_simulateV1 }

/** Schema for the `account_approveKeyAuthorization` JSON-RPC method. */
export const account_approveKeyAuthorization = from({
  method: 'account_approveKeyAuthorization',
  params: /* @__PURE__ */ z.tuple([
    /* @__PURE__ */ z.union([
      /* @__PURE__ */ z.object({ keyAuthorization: z_KeyAuthorization.Rpc }),
      /* @__PURE__ */ z.object({ hash: z_Hex.Hex, signature: z_Hex.Hex }),
    ]),
  ]),
  returns: z_AccountOperation.KeyAuthorizationOperation,
})

/** Schema for the `account_approveRawTransaction` JSON-RPC method. */
export const account_approveRawTransaction = from({
  method: 'account_approveRawTransaction',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: z_Hex.Hex,
})

/** Schema for the `account_approveRawTransactionSync` JSON-RPC method. */
export const account_approveRawTransactionSync = from({
  method: 'account_approveRawTransactionSync',
  params: /* @__PURE__ */ z.tuple([
    z_Hex.Hex,
    /* @__PURE__ */ z.optional(/* @__PURE__ */ z.number()),
  ]),
  returns: z_AccountOperation.TransactionOperation,
})

/** Schema for the `account_getConfig` JSON-RPC method. */
export const account_getConfig = from({
  method: 'account_getConfig',
  params: /* @__PURE__ */ z.tuple([
    /* @__PURE__ */ z.object({ address: z_Address.Address }),
  ]),
  returns: /* @__PURE__ */ z.nullable(z_AccountConfig.Rpc),
})

/** Schema for the `account_getOperation` JSON-RPC method. */
export const account_getOperation = from({
  method: 'account_getOperation',
  params: /* @__PURE__ */ z.tuple([z_Hex.Hex]),
  returns: /* @__PURE__ */ z.nullable(z_AccountOperation.Operation),
})

/** JSON-RPC method schemas for the `account_` namespace. */
export const Account = {
  account_approveKeyAuthorization,
  account_approveRawTransaction,
  account_approveRawTransactionSync,
  account_getConfig,
  account_getOperation,
}
