/* eslint-disable jsdoc-js/require-jsdoc, jsdoc-js/require-description, jsdoc-js/require-example */
import * as z_Block from '../Block.js'
import * as z_BlockOverrides from '../BlockOverrides.js'
import * as z_Hex from '../Hex.js'
import * as z_Log from '../Log.js'
import * as z_StateOverrides from '../StateOverrides.js'
import { from } from '../internal/rpcSchemas/from.js'
import * as z from 'zod/mini'
import * as z_KeyAuthorization from './KeyAuthorization.js'
import * as z_MultisigOperation from './MultisigOperation.js'
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

/** Schema for the `multisig_approveRawTransaction` JSON-RPC method. */
export const multisig_approveRawTransaction = from({
  method: 'multisig_approveRawTransaction',
  params: z.tuple([z_Hex.Hex]),
  returns: z_Hex.Hex,
})

/** Schema for the `multisig_approveRawTransactionSync` JSON-RPC method. */
export const multisig_approveRawTransactionSync = from({
  method: 'multisig_approveRawTransactionSync',
  params: z.tuple([z_Hex.Hex, z.optional(z.number())]),
  returns: z_MultisigOperation.TransactionOperation,
})

/** Schema for the `multisig_approveKeyAuthorization` JSON-RPC method. */
export const multisig_approveKeyAuthorization = from({
  method: 'multisig_approveKeyAuthorization',
  params: z.tuple([
    z.union([
      z.object({ keyAuthorization: z_KeyAuthorization.Rpc }),
      z.object({ hash: z_Hex.Hex, signature: z_Hex.Hex }),
    ]),
  ]),
  returns: z_MultisigOperation.KeyAuthorizationOperation,
})

/** Schema for the `multisig_getOperation` JSON-RPC method. */
export const multisig_getOperation = from({
  method: 'multisig_getOperation',
  params: z.tuple([z_Hex.Hex]),
  returns: z.nullable(z_MultisigOperation.Operation),
})

/** JSON-RPC method schemas for the `multisig_` namespace. */
export const Multisig = {
  multisig_approveKeyAuthorization,
  multisig_approveRawTransaction,
  multisig_approveRawTransactionSync,
  multisig_getOperation,
}
