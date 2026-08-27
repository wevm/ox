import type * as Address from '../core/Address.js'
import type * as Block from '../core/Block.js'
import type * as BlockOverrides from '../core/BlockOverrides.js'
import type * as Hex from '../core/Hex.js'
import type * as Log from '../core/Log.js'
import type * as RpcSchema from '../core/RpcSchema.js'
import type * as StateOverrides from '../core/StateOverrides.js'
import type * as KeyAuthorization from './KeyAuthorization.js'
import type * as MultisigConfig from './MultisigConfig.js'
import type * as MultisigOperation from './MultisigOperation.js'
import type * as TransactionRequest from './TransactionRequest.js'

/**
 * Union of all JSON-RPC Methods for the `tempo_` namespace.
 */
export type Tempo = RpcSchema.From<{
  Request: {
    method: 'tempo_simulateV1'
    params: [
      {
        blockStateCalls: readonly {
          blockOverrides?: BlockOverrides.Rpc | undefined
          calls?: readonly TransactionRequest.Rpc[] | undefined
          stateOverrides?: StateOverrides.Rpc | undefined
        }[]
        returnFullTransactions?: boolean | undefined
        traceTransfers?: boolean | undefined
        validation?: boolean | undefined
      },
      block: Block.Number<Hex.Hex> | Block.Tag | Block.Hash | Block.Identifier,
    ]
  }
  ReturnType: {
    blocks: readonly (Block.Rpc & {
      calls?:
        | readonly {
            error?:
              | {
                  data?: Hex.Hex | undefined
                  code: number
                  message: string
                }
              | undefined
            logs?: readonly Log.Rpc[] | undefined
            gasUsed: Hex.Hex
            returnData: Hex.Hex
            status: Hex.Hex
          }[]
        | undefined
    })[]
    tokenMetadata: {
      [address: Hex.Hex]: {
        name: string
        symbol: string
        currency: string
      }
    }
  }
}>

/** Union of all JSON-RPC methods for the `multisig_` namespace. */
export type Multisig = RpcSchema.From<
  | {
      Request: {
        method: 'multisig_approveRawTransaction'
        params: [serializedTransaction: Hex.Hex]
      }
      ReturnType: Hex.Hex
    }
  | {
      Request: {
        method: 'multisig_approveRawTransactionSync'
        params: [serializedTransaction: Hex.Hex, timeout?: number]
      }
      ReturnType: MultisigOperation.TransactionRpc
    }
  | {
      Request: {
        method: 'multisig_approveKeyAuthorization'
        params: [
          | { keyAuthorization: KeyAuthorization.Rpc }
          | { hash: Hex.Hex; signature: Hex.Hex },
        ]
      }
      ReturnType: MultisigOperation.KeyAuthorizationRpc
    }
  | {
      Request: {
        method: 'multisig_getConfig'
        params: [{ address: Address.Address }]
      }
      ReturnType: MultisigConfig.Rpc | null
    }
  | {
      Request: {
        method: 'multisig_getOperation'
        params: [hash: Hex.Hex]
      }
      ReturnType: MultisigOperation.Rpc | null
    }
>
