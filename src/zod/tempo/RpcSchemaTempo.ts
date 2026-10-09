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
  params: z.tuple([
    z.object({
      blockStateCalls: z.readonly(
        z.array(
          z.object({
            blockOverrides: z.optional(z_BlockOverrides.BlockOverrides),
            calls: z.optional(
              z.readonly(z.array(z_TransactionRequest.TransactionRequest)),
            ),
            stateOverrides: z.optional(z_StateOverrides.StateOverrides),
          }),
        ),
      ),
      returnFullTransactions: z.optional(z.boolean()),
      traceTransfers: z.optional(z.boolean()),
      validation: z.optional(z.boolean()),
    }),
    BlockNumberOrTagOrIdentifier,
  ]),
  returns: z.object({
    blocks: z.readonly(
      z.array(
        z.intersection(
          Block,
          z.object({
            calls: z.optional(
              z.readonly(
                z.array(
                  z.object({
                    error: z.optional(
                      z.object({
                        code: z.number(),
                        data: z.optional(z_Hex.Hex),
                        message: z.string(),
                      }),
                    ),
                    gasUsed: z_Hex.Hex,
                    logs: z.optional(z.readonly(z.array(z_Log.Log))),
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
    tokenMetadata: z.record(
      z_Hex.Hex,
      z.object({
        currency: z.string(),
        name: z.string(),
        symbol: z.string(),
      }),
    ),
  }),
})

/** JSON-RPC method schemas for the `tempo_` namespace. */
export const Tempo = { tempo_simulateV1 }

/** Schema for the `account_approveKeyAuthorization` JSON-RPC method. */
export const account_approveKeyAuthorization = from({
  method: 'account_approveKeyAuthorization',
  params: z.tuple([
    z.union([
      z.object({ keyAuthorization: z_KeyAuthorization.Rpc }),
      z.object({ hash: z_Hex.Hex, signature: z_Hex.Hex }),
    ]),
  ]),
  returns: z_AccountOperation.KeyAuthorizationOperation,
})

/** Schema for the `account_approveRawTransaction` JSON-RPC method. */
export const account_approveRawTransaction = from({
  method: 'account_approveRawTransaction',
  params: z.tuple([z_Hex.Hex]),
  returns: z_Hex.Hex,
})

/** Schema for the `account_approveRawTransactionSync` JSON-RPC method. */
export const account_approveRawTransactionSync = from({
  method: 'account_approveRawTransactionSync',
  params: z.tuple([z_Hex.Hex, z.optional(z.number())]),
  returns: z_AccountOperation.TransactionOperation,
})

/** Schema for the `account_getConfig` JSON-RPC method. */
export const account_getConfig = from({
  method: 'account_getConfig',
  params: z.tuple([z.object({ address: z_Address.Address })]),
  returns: z.nullable(z_AccountConfig.Rpc),
})

/** Schema for the `account_getOperation` JSON-RPC method. */
export const account_getOperation = from({
  method: 'account_getOperation',
  params: z.tuple([z_Hex.Hex]),
  returns: z.nullable(z_AccountOperation.Operation),
})

/** JSON-RPC method schemas for the `account_` namespace. */
export const Account = {
  account_approveKeyAuthorization,
  account_approveRawTransaction,
  account_approveRawTransactionSync,
  account_getConfig,
  account_getOperation,
}
