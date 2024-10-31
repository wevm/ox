import type * as AccountProof from './AccountProof.js'
import type * as Address from './Address.js'
import type * as Block from './Block.js'
import type * as Fee from './Fee.js'
import type * as Filter from './Filter.js'
import type * as Hex from './Hex.js'
import type * as Log from './Log.js'
import type * as Transaction from './Transaction.js'
import type * as TransactionReceipt from './TransactionReceipt.js'
import type * as TransactionRequest from './TransactionRequest.js'
import type * as internal from './internal/rpcSchema.js'
import type { Compute, IsNarrowable } from './internal/types.js'

/**
 * Instantiates a statically typed Schema. This is a runtime-noop function, and is purposed
 * to be used as a type-level tag to be used with {@link ox#Provider.(from:function)} or
 * {@link ox#RpcTransport.(fromHttp:function)}.
 *
 * @example
 * ### Using with `Provider.from`
 *
 * ```ts twoslash
 * // @noErrors
 * import 'ox/window'
 * import { Provider, RpcSchema } from 'ox'
 *
 * const schema = RpcSchema.from<{
 *   Request: {
 *     method: 'eth_foobar',
 *     params: [id: number],
 *   }
 *   ReturnType: string
 * } | {
 *   Request: {
 *     method: 'eth_barfoo',
 *     params: [id: string],
 *   }
 *   ReturnType: string
 * }>()
 *
 * const provider = Provider.from(window.ethereum, { schema })
 *
 * const blockNumber = await provider.request({ method: 'e' })
 * //                                                    ^|
 * ```
 */
export function from<schema extends Generic>(): schema {
  return null as never
}

/**
 * Extracts a method from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Eth_GetBlockByNumber = RpcSchema.ExtractMethod<'eth_getBlockByNumber'>
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type ExtractMethod<schema extends Generic | MethodNameGeneric> =
  Compute<{
    Request: ExtractRequest<schema>
    ReturnType: ExtractReturnType<schema>
  }>

/**
 * Extracts request from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Eth_GetBlockByNumber = RpcSchema.ExtractRequest<'eth_getBlockByNumber'>
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
// TODO: clean
export type ExtractRequest<
  schemaOrMethodName extends Generic | MethodNameGeneric,
  schema extends Generic = All,
> = Compute<
  Omit<
    {
      method: schemaOrMethodName extends Generic
        ? schemaOrMethodName['Request']['method']
        : schemaOrMethodName | MethodName
      params?: unknown
    } & (schemaOrMethodName extends Generic
      ? schemaOrMethodName['Request']
      : IsNarrowable<schemaOrMethodName, MethodName> extends true
        ? Extract<
            schema,
            { Request: { method: schemaOrMethodName } }
          >['Request']
        : {}),
    ''
  >
>

/**
 * Extracts parameters from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Eth_GetBlockByNumber = RpcSchema.ExtractParams<'eth_getBlockByNumber'>
 * //   ^?
 *
 *
 *
 *
 *
 * ```
 */
export type ExtractParams<schema extends Generic | MethodNameGeneric> =
  ExtractRequest<schema>['params']

/**
 * Extracts return type from a {@link ox#RpcSchema.Generic} or {@link ox#RpcSchema.MethodNameGeneric}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Eth_GetBlockByNumber = RpcSchema.ExtractReturnType<'eth_getBlockByNumber'>
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type ExtractReturnType<
  schemaOrMethodName extends Generic | MethodNameGeneric,
  schema extends Generic = All,
> = schemaOrMethodName extends Generic
  ? schemaOrMethodName['ReturnType']
  : schemaOrMethodName extends MethodName
    ? Extract<schema, { Request: { method: schemaOrMethodName } }>['ReturnType']
    : unknown

////////////////////////////////////////////////////////////////
// Define Method
////////////////////////////////////////////////////////////////

/**
 * Type to define a custom type-safe JSON-RPC Schema to be used with {@link ox#RpcRequest.(from:function)}.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema, RpcRequest } from 'ox'
 *
 * type Schema = RpcSchema.From<{
 *   Request: {
 *     method: 'eth_foobar',
 *     params: [id: number],
 *   }
 *   ReturnType: string
 * }>
 * const request = RpcRequest.from<Schema>({
 *   id: 0,
 *   method: 'eth_foobar',
 *   params: [0],
 * })
 * ```
 */
export type From<schema extends Generic> = schema

////////////////////////////////////////////////////////////////
// Generic
////////////////////////////////////////////////////////////////

/**
 * Generic type to define a JSON-RPC Method.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Schema = RpcSchema.Generic
 * //   ^?
 *
 *
 *
 *
 *
 *
 * ```
 */
export type Generic<name extends string = string, params = unknown> = {
  Request: {
    method: name
    params?: params | undefined
  }
  ReturnType?: unknown
}

/**
 * Generic type to define a JSON-RPC Method Name.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Name = RpcSchema.MethodNameGeneric
 * //   ^?
 *
 *
 *
 *
 *
 * ```
 */
export type MethodNameGeneric = MethodName | (string & {})

////////////////////////////////////////////////////////////////
// All Methods
////////////////////////////////////////////////////////////////

/**
 * Type-safe union of all JSON-RPC Methods.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Schema = RpcSchema.All
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type All = Eth | Wallet

/**
 * Type-safe union of all JSON-RPC Method Names.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type MethodName = RpcSchema.MethodName
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type MethodName = MethodNameEth | MethodNameWallet

/**
 * Union of all JSON-RPC Methods for the `eth_` namespace.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Schema = RpcSchema.Eth
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type Eth = [
  /**
   * Returns a list of addresses owned by this client
   *
   * @example
   * ```
   * request({ method: 'eth_accounts' })
   * // => ['0x0fB69...']
   * ```
   */
  {
    Request: {
      method: 'eth_accounts'
      params?: undefined
    }
    ReturnType: Address.Address[]
  },
  /**
   * Returns the base fee per blob gas in wei.
   *
   * @example
   * ```
   * request({ method: 'eth_blobBaseFee' })
   * // '0x09184e72a000'
   * ```
   */
  {
    Request: {
      method: 'eth_blobBaseFee'
      params?: undefined
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns the number of the most recent block seen by this client
   *
   * @example
   * ```
   * request({ method: 'eth_blockNumber' })
   * // '0x1b4'
   * ```
   */
  {
    Request: {
      method: 'eth_blockNumber'
      params?: undefined
    }
    ReturnType: Hex.Hex
  },
  /**
   * Executes a new message call immediately without submitting a transaction to the network
   *
   * ```
   * request({ method: 'eth_call', params: [{ to: '0x...', data: '0x...' }] })
   * // '0x...'
   * ```
   */
  {
    Request: {
      method: 'eth_call'
      params:
        | [transaction: TransactionRequest.Rpc]
        | [
            transaction: TransactionRequest.Rpc,
            block: Block.Number<Hex.Hex> | Block.Tag | Block.Hash,
          ]
        | [
            transaction: TransactionRequest.Rpc,
            block: Block.Number<Hex.Hex> | Block.Tag | Block.Hash,
            // TODO: add type
            stateOverride: unknown,
          ]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns the chain ID associated with the current network
   *
   * @example
   * ```
   * request({ method: 'eth_chainId' })
   * // => '0x1'
   * ```
   */
  {
    Request: {
      method: 'eth_chainId'
      params?: undefined
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns the client coinbase address.
   *
   * @example
   * ```
   * request({ method: 'eth_coinbase' })
   * // '0x...'
   * ```
   */
  {
    Request: {
      method: 'eth_coinbase'
      params?: undefined
    }
    ReturnType: Address.Address
  },
  /**
   * Estimates the gas necessary to complete a transaction without submitting it to the network
   *
   * @example
   * ```
   * request({
   *  method: 'eth_estimateGas',
   *  params: [{ from: '0x...', to: '0x...', value: '0x...' }]
   * })
   * // '0x5208'
   * ```
   */
  {
    Request: {
      method: 'eth_estimateGas'
      params:
        | [transaction: TransactionRequest.Rpc]
        | [
            transaction: TransactionRequest.Rpc,
            block: Block.Number<Hex.Hex> | Block.Tag | Block.Hash,
          ]
        | [
            transaction: TransactionRequest.Rpc,
            block: Block.Number<Hex.Hex> | Block.Tag | Block.Hash,
            // TODO: add type
            stateOverride: unknown,
          ]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns a collection of historical gas information
   *
   * ```
   * request({
   *  method: 'eth_feeHistory',
   *  params: ['4', 'latest', ['25', '75']]
   * })
   * // {
   * //   oldestBlock: '0x1',
   * //   baseFeePerGas: ['0x1', '0x2', '0x3', '0x4'],
   * //   gasUsedRatio: ['0x1', '0x2', '0x3', '0x4'],
   * //   reward: [['0x1', '0x2'], ['0x3', '0x4'], ['0x5', '0x6'], ['0x7', '0x8']]
   * // }
   * ```
   * */
  {
    Request: {
      method: 'eth_feeHistory'
      params: [
        /** Number of blocks in the requested range. Between 1 and 1024 blocks can be requested in a single query. Less than requested may be returned if not all blocks are available. */
        blockCount: Hex.Hex,
        /** Highest number block of the requested range. */
        newestBlock: Block.Number<Hex.Hex> | Block.Tag,
        /** A monotonically increasing list of percentile values to sample from each block's effective priority fees per gas in ascending order, weighted by gas used. */
        rewardPercentiles: number[] | undefined,
      ]
    }
    ReturnType: Fee.FeeHistoryRpc
  },
  /**
   * Returns the current price of gas expressed in wei
   *
   * ```
   * request({ method: 'eth_gasPrice' })
   * // '0x09184e72a000'
   * ```
   */
  {
    Request: {
      method: 'eth_gasPrice'
      params?: undefined
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns the balance of an address in wei
   *
   * @example
   * ```
   * request({ method: 'eth_getBalance', params: ['0x...', 'latest'] })
   * // => '0x12a05...'
   * ```
   */
  {
    Request: {
      method: 'eth_getBalance'
      params: [
        address: Address.Address,
        block: Block.Number<Hex.Hex> | Block.Tag | Block.Hash,
      ]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns information about a block specified by hash
   *
   * ```
   * request({ method: 'eth_getBlockByHash', params: ['0x...', true] })
   * // {
   * //   number: '0x1b4',
   * //   hash: '0x...',
   * //   parentHash: '0x...',
   * //   ...
   * // }
   * ```
   */
  {
    Request: {
      method: 'eth_getBlockByHash'
      params: [
        /** hash of a block */
        hash: Hex.Hex,
        /** true will pull full transaction objects, false will pull transaction hashes */
        includeTransactionObjects: boolean,
      ]
    }
    ReturnType: Block.Rpc | null
  },
  /**
   * Returns information about a block specified by number
   *
   * @example
   * ```
   * request({ method: 'eth_getBlockByNumber', params: ['0x1b4', true] })
   * // {
   * //   number: '0x1b4',
   * //   hash: '0x...',
   * //   parentHash: '0x...',
   * //   ...
   * // }
   * ```
   */
  {
    Request: {
      method: 'eth_getBlockByNumber'
      params: [
        /** block number, or one of "latest", "safe", "finalized", "earliest" or "pending" */
        block: Block.Number<Hex.Hex> | Block.Tag,
        /** true will pull full transaction objects, false will pull transaction hashes */
        includeTransactionObjects: boolean,
      ]
    }
    ReturnType: Block.Rpc | null
  },
  /**
   * Returns the number of transactions in a block specified by block hash
   *
   * ```
   * request({ method: 'eth_getBlockTransactionCountByHash', params: ['0x...'] })
   * // '0x1'
   * ```
   */
  {
    Request: {
      method: 'eth_getBlockTransactionCountByHash'
      params: [hash: Hex.Hex]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns the number of transactions in a block specified by block number
   *
   * ```
   * request({ method: 'eth_getBlockTransactionCountByNumber', params: ['0x1b4'] })
   * // '0x1'
   * ```
   */
  {
    Request: {
      method: 'eth_getBlockTransactionCountByNumber'
      params: [block: Block.Number<Hex.Hex> | Block.Tag]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns the contract code stored at a given address
   *
   * @example
   * ```
   * request({ method: 'eth_getCode', params: ['0x...', 'latest'] })
   * // '0x...'
   * ```
   */
  {
    Request: {
      method: 'eth_getCode'
      params: [
        address: Address.Address,
        block: Block.Number<Hex.Hex> | Block.Tag | Block.Hash,
      ]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns a list of all logs based on filter ID since the last log retrieval
   *
   * @example
   * ```
   * request({ method: 'eth_getFilterChanges', params: ['0x...'] })
   * // => [{ ... }, { ... }]
   * ```
   */
  {
    Request: {
      method: 'eth_getFilterChanges'
      params: [filterId: Hex.Hex]
    }
    ReturnType: readonly Log.Rpc[] | readonly Hex.Hex[]
  },
  /**
   * Returns a list of all logs based on filter ID
   *
   * @example
   * ```
   * request({ method: 'eth_getFilterLogs', params: ['0x...'] })
   * // => [{ ... }, { ... }]
   * ```
   */
  {
    Request: {
      method: 'eth_getFilterLogs'
      params: [filterId: Hex.Hex]
    }
    ReturnType: readonly Log.Rpc[]
  },
  /**
   * Returns a list of all logs based on a filter object
   *
   * @example
   * ```
   * request({ method: 'eth_getLogs', params: [{ fromBlock: '0x...', toBlock: '0x...', address: '0x...', topics: ['0x...'] }] })
   * // => [{ ... }, { ... }]
   * ```
   */
  {
    Request: {
      method: 'eth_getLogs'
      params: [filter: Filter.Rpc]
    }
    ReturnType: readonly Log.Rpc[]
  },
  /**
   * Returns the account and storage values of the specified account including the Merkle-proof.
   *
   * @example
   * ```
   * request({ method: 'eth_getProof', params: ['0x...', ['0x...'], 'latest'] })
   * // {
   * //   ...
   * // }
   * ```
   */
  {
    Request: {
      method: 'eth_getProof'
      params: [
        /** Address of the account. */
        address: Address.Address,
        /** An array of storage-keys that should be proofed and included. */
        storageKeys: Hex.Hex[],
        /** Block identifier to pull the proof from. */
        block: Block.Number<Hex.Hex> | Block.Tag | Block.Hash,
      ]
    }
    ReturnType: AccountProof.AccountProofRpc
  },
  /**
   * Returns the value from a storage position at an address
   *
   * @example
   * ```
   * request({ method: 'eth_getStorageAt', params: ['0x...', '0x...', 'latest'] })
   * // '0x...'
   * ```
   */
  {
    Request: {
      method: 'eth_getStorageAt'
      params: [
        address: Address.Address,
        index: Hex.Hex,
        block: Block.Number<Hex.Hex> | Block.Tag | Block.Hash,
      ]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns information about a transaction specified by block hash and transaction index
   *
   * @example
   * ```
   * request({ method: 'eth_getTransactionByBlockHashAndIndex', params: ['0x...', '0x...'] })
   * // { ... }
   * ```
   */
  {
    Request: {
      method: 'eth_getTransactionByBlockHashAndIndex'
      params: [hash: Hex.Hex, index: Hex.Hex]
    }
    ReturnType: Transaction.Rpc | null
  },
  /**
   * Returns information about a transaction specified by block number and transaction index
   *
   * @example
   * ```
   * request({ method: 'eth_getTransactionByBlockNumberAndIndex', params: ['0x...', '0x...'] })
   * // { ... }
   * ```
   */
  {
    Request: {
      method: 'eth_getTransactionByBlockNumberAndIndex'
      params: [block: Block.Number<Hex.Hex> | Block.Tag, index: Hex.Hex]
    }
    ReturnType: Transaction.Rpc | null
  },
  /**
   * Returns information about a transaction specified by hash
   *
   * @example
   * ```
   * request({ method: 'eth_getTransactionByHash', params: ['0x...'] })
   * // { ... }
   * ```
   */
  {
    Request: {
      method: 'eth_getTransactionByHash'
      params: [hash: Hex.Hex]
    }
    ReturnType: Transaction.Rpc | null
  },
  /**
   * Returns the number of transactions sent from an address
   *
   * @example
   * ```
   * request({ method: 'eth_getTransactionCount', params: ['0x...', 'latest'] })
   * // '0x1'
   * ```
   */
  {
    Request: {
      method: 'eth_getTransactionCount'
      params: [
        address: Address.Address,
        block: Block.Number<Hex.Hex> | Block.Tag | Block.Hash,
      ]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns the receipt of a transaction specified by hash
   *
   * @example
   * ```
   * request({ method: 'eth_getTransactionReceipt', params: ['0x...'] })
   * // { ... }
   * ```
   */
  {
    Request: {
      method: 'eth_getTransactionReceipt'
      params: [hash: Hex.Hex]
    }
    ReturnType: TransactionReceipt.Rpc | null
  },
  /**
   * Returns the number of uncles in a block specified by block hash
   *
   * @example
   * ```
   * request({ method: 'eth_getUncleCountByBlockHash', params: ['0x...'] })
   * // => '0x1'
   * ```
   */
  {
    Request: {
      method: 'eth_getUncleCountByBlockHash'
      params: [hash: Hex.Hex]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns the number of uncles in a block specified by block number
   *
   * @example
   * ```
   * request({ method: 'eth_getUncleCountByBlockNumber', params: ['0x...'] })
   * // '0x1'
   * ```
   */
  {
    Request: {
      method: 'eth_getUncleCountByBlockNumber'
      params: [block: Block.Number<Hex.Hex> | Block.Tag]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns the current maxPriorityFeePerGas in wei.
   *
   * @example
   * ```
   * request({ method: 'eth_maxPriorityFeePerGas' })
   * // => '0x5f5e100'
   * ```
   */
  {
    Request: {
      method: 'eth_maxPriorityFeePerGas'
      params?: undefined
    }
    ReturnType: Hex.Hex
  },
  /**
   * Creates a filter to listen for new blocks that can be used with `eth_getFilterChanges`
   *
   * @example
   * ```
   * request({ method: 'eth_newBlockFilter' })
   * // => '0x1'
   * ```
   */
  {
    Request: {
      method: 'eth_newBlockFilter'
      params?: undefined
    }
    ReturnType: Hex.Hex
  },
  /**
   * Creates a filter to listen for specific state changes that can then be used with `eth_getFilterChanges`
   *
   * @example
   * ```
   * request({ method: 'eth_newFilter', params: [{ fromBlock: '0x...', toBlock: '0x...', address: '0x...', topics: ['0x...'] }] })
   * // => '0x1'
   * ```
   */
  {
    Request: {
      method: 'eth_newFilter'
      params: [filter: Filter.Rpc]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Creates a filter to listen for new pending transactions that can be used with `eth_getFilterChanges`
   *
   * @example
   * ```
   * request({ method: 'eth_newPendingTransactionFilter' })
   * // '0x1'
   * ```
   */
  {
    Request: {
      method: 'eth_newPendingTransactionFilter'
      params?: undefined
    }
    ReturnType: Hex.Hex
  },
  /**
   * Returns the current Ethereum protocol version
   *
   * @example
   * ```
   * request({ method: 'eth_protocolVersion' })
   * // '54'
   * ```
   */
  {
    Request: {
      method: 'eth_protocolVersion'
      params?: undefined
    }
    ReturnType: string
  },
  /**
   * Requests that the user provides an Ethereum address to be identified by. Typically causes a browser extension popup to appear.
   *
   * @example
   * ```
   * request({ method: 'eth_requestAccounts' })
   * // => ['0x...', '0x...']
   * ```
   */
  {
    Request: {
      method: 'eth_requestAccounts'
      params?: undefined
    }
    ReturnType: readonly Address.Address[]
  },
  /**
   * Sends a **signed** transaction to the network
   *
   * @example
   * ```
   * request({ method: 'eth_sendRawTransaction', params: ['0x...'] })
   * // => '0x...'
   * ```
   */
  {
    Request: {
      method: 'eth_sendRawTransaction'
      params: [serializedTransaction: Hex.Hex]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Creates, signs, and sends a new transaction to the network
   *
   * @example
   * ```
   * request({ method: 'eth_sendTransaction', params: [{ from: '0x...', to: '0x...', value: '0x...' }] })
   * // '0x...'
   * ```
   */
  {
    Request: {
      method: 'eth_sendTransaction'
      params: [transaction: TransactionRequest.Rpc]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Signs a transaction that can be submitted to the network at a later time using with `eth_sendRawTransaction`
   *
   * @example
   * ```
   * request({ method: 'eth_signTransaction', params: [{ from: '0x...', to: '0x...', value: '0x...' }] })
   * // '0x...'
   * ```
   */
  {
    Request: {
      method: 'eth_signTransaction'
      params: [request: TransactionRequest.Rpc]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Calculates an Ethereum-specific signature in the form of `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`
   *
   * @example
   * ```
   * request({ method: 'eth_signTypedData_v4', params: [{ from: '0x...', data: [{ type: 'string', name: 'message', value: 'hello world' }] }] })
   * // '0x...'
   * ```
   */
  {
    Request: {
      method: 'eth_signTypedData_v4'
      params: [
        /** Address to use for signing */
        address: Address.Address,
        /** Message to sign containing type information, a domain separator, and data */
        message: string,
      ]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Destroys a filter based on filter ID
   *
   * @example
   * ```
   * request({ method: 'eth_uninstallFilter', params: ['0x1'] })
   * // true
   * ```
   */
  {
    Request: {
      method: 'eth_uninstallFilter'
      params: [filterId: Hex.Hex]
    }
    ReturnType: boolean
  },
][number]

/**
 * Union of all JSON-RPC Method Names for the `eth_` namespace.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Name = RpcSchema.MethodNameEth
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type MethodNameEth = Eth['Request']['method']

/**
 * Union of all JSON-RPC Methods for the `wallet_` namespace.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Schema = RpcSchema.Wallet
 * //   ^?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * ```
 */
export type Wallet = [
  /**
   * Requests that the user provides an Ethereum address to be identified by.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-1102}
   */
  {
    Request: {
      method: 'eth_requestAccounts'
      params?: undefined
    }
    ReturnType: readonly Address.Address[]
  },
  /**
   * Calculates an Ethereum-specific signature in the form of `keccak256("\x19Ethereum Signed Message:\n" + len(message) + message))`
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-1474}
   */
  {
    Request: {
      method: 'personal_sign'
      params: [
        /** Data to sign */
        data: Hex.Hex,
        /** Address to use for signing */
        address: Address.Address,
      ]
    }
    ReturnType: Hex.Hex
  },
  /**
   * Add an Ethereum chain to the wallet.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-3085}
   */
  {
    Request: {
      method: 'wallet_addEthereumChain'
      params: [chain: Compute<internal.WalletAddEthereumChainParameters>]
    }
    ReturnType: null
  },
  /**
   * Returns the status of a call batch that was sent via `wallet_sendCalls`.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-5792}
   */
  {
    Request: {
      method: 'wallet_getCallsStatus'
      params?: [string]
    }
    ReturnType: Compute<internal.WalletGetCallsStatusReturnType>
  },
  /**
   * Gets the connected wallet's capabilities.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-5792}
   */
  {
    Request: {
      method: 'wallet_getCapabilities'
      params?: [Address.Address]
    }
    ReturnType: Compute<internal.WalletCapabilitiesMap>
  },
  /**
   * Gets the wallets current permissions.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-2255}
   */
  {
    Request: {
      method: 'wallet_getPermissions'
      params?: undefined
    }
    ReturnType: readonly Compute<internal.WalletPermission>[]
  },
  /**
   * Requests permissions from a wallet.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-7715}
   */
  {
    Request: {
      method: 'wallet_grantPermissions'
      params?: [internal.WalletGrantPermissionsParameters]
    }
    ReturnType: Compute<internal.WalletGrantPermissionsReturnType>
  },
  /**
   * Requests the given permissions from the user.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-2255}
   */
  {
    Request: {
      method: 'wallet_requestPermissions'
      params: [permissions: { eth_accounts: Record<string, any> }]
    }
    ReturnType: readonly Compute<internal.WalletPermission>[]
  },
  /**
   * Revokes the given permissions from the user.
   *
   * @see {@link https://github.com/MetaMask/metamask-improvement-proposals/blob/main/MIPs/mip-2.md}
   */
  {
    Request: {
      method: 'wallet_revokePermissions'
      params: [permissions: { eth_accounts: Record<string, any> }]
    }
    ReturnType: null
  },
  /**
   * Requests the connected wallet to send a batch of calls.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-5792}
   */
  {
    Request: {
      method: 'wallet_sendCalls'
      params: Compute<internal.WalletSendCallsParameters>
    }
    ReturnType: string
  },
  /**
   * Requests for the wallet to show information about a call batch
   * that was sent via `wallet_sendCalls`.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-5792}
   */
  {
    Request: {
      method: 'wallet_showCallsStatus'
      params: [string]
    }
    ReturnType: undefined
  },
  /**
   * Switch the wallet to the given Ethereum chain.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-3326}
   */
  {
    Request: {
      method: 'wallet_switchEthereumChain'
      params: [chain: { chainId: string }]
    }
    ReturnType: null
  },
  /**
   * Requests that the user tracks the token in their wallet. Returns a boolean indicating if the token was successfully added.
   *
   * @see {@link https://eips.ethereum.org/EIPS/eip-747}
   */
  {
    Request: {
      method: 'wallet_watchAsset'
      params: [Compute<internal.WalletWatchAssetParameters>]
    }
    ReturnType: boolean
  },
][number]

/**
 * Union of all JSON-RPC Method Names for the `wallet_` namespace.
 *
 * @example
 * ```ts twoslash
 * import { RpcSchema } from 'ox'
 *
 * type Name = RpcSchema.MethodNameWallet
 * //   ^?
 *
 *
 *
 *
 *
 *
 * ```
 */
export type MethodNameWallet = Wallet['Request']['method']
