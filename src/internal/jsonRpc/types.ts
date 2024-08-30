import type { AccountProof_Rpc } from '../accountProof/types.js'
import type { Address } from '../address/types.js'
import type {
  Block_Hash,
  Block_Number,
  Block_Rpc,
  Block_Tag,
} from '../block/types.js'
import type { FeeHistoryRpc } from '../fee/types.js'
import type { Filter_Rpc } from '../filter/types.js'
import type { Hex } from '../hex/types.js'
import type { Log_Rpc } from '../log/types.js'
import type { Transaction_Rpc } from '../transaction/isomorphic/types.js'
import type { TransactionReceipt_Rpc } from '../transactionReceipt/types.js'
import type { Compute, ExactPartial } from '../types.js'
import type { GetMethod, JsonRpc_buildRequest } from './buildRequest.js'

/** A JSON-RPC request object as per the [JSON-RPC 2.0 specification](https://www.jsonrpc.org/specification#request_object). */
export type JsonRpc_Request<
  method extends JsonRpc_MethodGeneric = JsonRpc_MethodGeneric,
> = Compute<
  Omit<method, 'returnType'> & {
    id: number
    jsonrpc: '2.0'
  }
>

/** JSON-RPC request store type. */
export type JsonRpc_RequestStore<
  method extends JsonRpc_MethodGeneric | undefined,
> = Compute<{
  buildRequest: <
    method_inferred extends JsonRpc_MethodGeneric | JsonRpc_MethodNameGeneric,
  >(
    options: GetMethod<
      method extends JsonRpc_MethodGeneric ? method : method_inferred
    >,
  ) => JsonRpc_buildRequest.ReturnType<
    method extends JsonRpc_MethodGeneric ? method : method_inferred
  >
  readonly id: number
}>

////////////////////////////////////////////////////////////////
// Define Method
////////////////////////////////////////////////////////////////

/**
 * Type to define a custom type-safe JSON-RPC Method to be used with {@link JsonRpc#buildRequest}.
 *
 * @example
 * ```ts twoslash
 * import { JsonRpc } from 'ox'
 *
 * const Eth_Foobar = JsonRpc.DefineMethod<{
 *   method: 'eth_foobar',
 *   params: [id: number],
 *   returnType: string
 * }>
 * const request = JsonRpc.buildRequest<Eth_Foobar>({
 *   id: 0,
 *   method: 'eth_foobar',
 *   params: [0],
 * })
 * ```
 */
export type JsonRpc_DefineMethod<method extends JsonRpc_MethodGeneric> = method

////////////////////////////////////////////////////////////////
// Generic
////////////////////////////////////////////////////////////////

/** Generic type to define a JSON-RPC Method. */
export type JsonRpc_MethodGeneric<
  name extends string = string,
  params extends unknown[] | undefined = unknown[] | undefined,
> = {
  method: name
  params?: params | undefined
  returnType?: unknown
}

/** Generic type to define a JSON-RPC Method Name. */
export type JsonRpc_MethodNameGeneric = JsonRpc_MethodNameEth | (string & {})

////////////////////////////////////////////////////////////////
// All Methods
////////////////////////////////////////////////////////////////

/** Type-safe set of all JSON-RPC Methods. */
export type JsonRpc_Methods = JsonRpc_MethodsEth

/** Type-safe union of all JSON-RPC Methods. */
export type JsonRpc_Method = JsonRpc_MethodEth

/** Type-safe union of all JSON-RPC Method Names. */
export type JsonRpc_MethodName = JsonRpc_MethodNameEth

////////////////////////////////////////////////////////////////
// eth_ Methods
////////////////////////////////////////////////////////////////

/** Set of all JSON-RPC Methods for the `eth_` namespace. */
export type JsonRpc_MethodsEth = [
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
    method: 'eth_accounts'
    params?: undefined
    returnType: Address[]
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
    method: 'eth_blobBaseFee'
    params?: undefined
    returnType: Hex
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
    method: 'eth_blockNumber'
    params?: undefined
    returnType: Hex
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
    method: 'eth_call'
    params:
      | [transaction: ExactPartial<Transaction_Rpc>]
      | [
          transaction: ExactPartial<Transaction_Rpc>,
          block: Block_Number<Hex> | Block_Tag | Block_Hash,
        ]
      | [
          transaction: ExactPartial<Transaction_Rpc>,
          block: Block_Number<Hex> | Block_Tag | Block_Hash,
          // TODO: add type
          stateOverride: unknown,
        ]
    returnType: Hex
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
    method: 'eth_chainId'
    params?: undefined
    returnType: Hex
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
    method: 'eth_coinbase'
    params?: undefined
    returnType: Address
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
    method: 'eth_estimateGas'
    params:
      | [transaction: ExactPartial<Transaction_Rpc>]
      | [
          transaction: ExactPartial<Transaction_Rpc>,
          block: Block_Number<Hex> | Block_Tag | Block_Hash,
        ]
      | [
          transaction: ExactPartial<Transaction_Rpc>,
          block: Block_Number<Hex> | Block_Tag | Block_Hash,
          // TODO: add type
          stateOverride: unknown,
        ]
    returnType: Hex
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
    method: 'eth_feeHistory'
    params: [
      /** Number of blocks in the requested range. Between 1 and 1024 blocks can be requested in a single query. Less than requested may be returned if not all blocks are available. */
      blockCount: Hex,
      /** Highest number block of the requested range. */
      newestBlock: Block_Number<Hex> | Block_Tag,
      /** A monotonically increasing list of percentile values to sample from each block's effective priority fees per gas in ascending order, weighted by gas used. */
      rewardPercentiles: number[] | undefined,
    ]
    returnType: FeeHistoryRpc
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
    method: 'eth_gasPrice'
    params?: undefined
    returnType: Hex
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
    method: 'eth_getBalance'
    params: [
      address: Address,
      block: Block_Number<Hex> | Block_Tag | Block_Hash,
    ]
    returnType: Hex
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
    method: 'eth_getBlockByHash'
    params: [
      /** hash of a block */
      hash: Hex,
      /** true will pull full transaction objects, false will pull transaction hashes */
      includeTransactionObjects: boolean,
    ]
    returnType: Block_Rpc | null
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
    method: 'eth_getBlockByNumber'
    params: [
      /** block number, or one of "latest", "safe", "finalized", "earliest" or "pending" */
      block: Block_Number<Hex> | Block_Tag,
      /** true will pull full transaction objects, false will pull transaction hashes */
      includeTransactionObjects: boolean,
    ]
    returnType: Block_Rpc | null
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
    method: 'eth_getBlockTransactionCountByHash'
    params: [hash: Hex]
    returnType: Hex
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
    method: 'eth_getBlockTransactionCountByNumber'
    params: [block: Block_Number<Hex> | Block_Tag]
    returnType: Hex
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
    method: 'eth_getCode'
    params: [
      address: Address,
      block: Block_Number<Hex> | Block_Tag | Block_Hash,
    ]
    returnType: Hex
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
    method: 'eth_getFilterChanges'
    params: [filterId: Hex]
    returnType: readonly Log_Rpc[] | readonly Hex[]
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
    method: 'eth_getFilterLogs'
    params: [filterId: Hex]
    returnType: readonly Log_Rpc[]
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
    method: 'eth_getLogs'
    params: [filter: Filter_Rpc]
    returnType: readonly Log_Rpc[]
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
    method: 'eth_getProof'
    params: [
      /** Address of the account. */
      address: Address,
      /** An array of storage-keys that should be proofed and included. */
      storageKeys: Hex[],
      /** Block identifier to pull the proof from. */
      block: Block_Number<Hex> | Block_Tag | Block_Hash,
    ]
    returnType: AccountProof_Rpc
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
    method: 'eth_getStorageAt'
    params: [
      address: Address,
      index: Hex,
      block: Block_Number<Hex> | Block_Tag | Block_Hash,
    ]
    returnType: Hex
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
    method: 'eth_getTransactionByBlockHashAndIndex'
    params: [hash: Hex, index: Hex]
    returnType: Transaction_Rpc | null
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
    method: 'eth_getTransactionByBlockNumberAndIndex'
    params: [block: Block_Number<Hex> | Block_Tag, index: Hex]
    returnType: Transaction_Rpc | null
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
    method: 'eth_getTransactionByHash'
    params: [hash: Hex]
    returnType: Transaction_Rpc | null
  },
  /**
   * Returns the number of transactions sent from an address
   *
   * ```
   * request({ method: 'eth_getTransactionCount', params: ['0x...', 'latest'] })
   * // '0x1'
   * ```
   */
  {
    method: 'eth_getTransactionCount'
    params: [
      address: Address,
      block: Block_Number<Hex> | Block_Tag | Block_Hash,
    ]
    returnType: Hex
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
    method: 'eth_getTransactionReceipt'
    params: [hash: Hex]
    returnType: TransactionReceipt_Rpc | null
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
    method: 'eth_getUncleCountByBlockHash'
    params: [hash: Hex]
    returnType: Hex
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
    method: 'eth_getUncleCountByBlockNumber'
    params: [block: Block_Number<Hex> | Block_Tag]
    returnType: Hex
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
    method: 'eth_maxPriorityFeePerGas'
    params?: undefined
    returnType: Hex
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
    method: 'eth_newBlockFilter'
    params?: undefined
    returnType: Hex
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
    method: 'eth_newFilter'
    params: [filter: Filter_Rpc]
    returnType: Hex
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
    method: 'eth_newPendingTransactionFilter'
    params?: undefined
    returnType: Hex
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
    method: 'eth_protocolVersion'
    params?: undefined
    returnType: string
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
    method: 'eth_requestAccounts'
    params?: undefined
    returnType: readonly Address[]
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
    method: 'eth_sendRawTransaction'
    params: [serializedTransaction: Hex]
    returnType: Hex
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
    method: 'eth_sendTransaction'
    params: [transaction: ExactPartial<Transaction_Rpc>]
    returnType: Hex
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
    method: 'eth_signTransaction'
    params: [request: ExactPartial<Transaction_Rpc>]
    returnType: Hex
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
    method: 'eth_signTypedData_v4'
    params: [
      /** Address to use for signing */
      address: Address,
      /** Message to sign containing type information, a domain separator, and data */
      message: string,
    ]
    returnType: Hex
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
    method: 'eth_uninstallFilter'
    params: [filterId: Hex]
    returnType: boolean
  },
]

/** Union of all JSON-RPC Methods for the `eth_` namespace. */
export type JsonRpc_MethodEth = JsonRpc_MethodsEth[number]

/** Union of all JSON-RPC Method Names for the `eth_` namespace. */
export type JsonRpc_MethodNameEth = JsonRpc_MethodEth['method']
