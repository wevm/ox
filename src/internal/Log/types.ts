import type { Address } from '../Address/types.js'
import type { Hex } from '../Hex/types.js'
import type { Compute } from '../types.js'

/** A Log as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/receipt.yaml). */
export type Log<
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<{
  /** The address from which this log originated */
  address: Address
  /** Hash of block containing this log or `null` if pending */
  blockHash: pending extends true ? null : Hex
  /** Number of block containing this log or `null` if pending */
  blockNumber: pending extends true ? null : bigintType
  /** Contains the non-integered arguments of the log */
  data: Hex
  /** Index of this log within its block or `null` if pending */
  logIndex: pending extends true ? null : numberType
  /** List of topics associated with this log */
  topics: readonly Hex[]
  /** Hash of the transaction that created this log or `null` if pending */
  transactionHash: pending extends true ? null : Hex
  /** Index of the transaction that created this log or `null` if pending */
  transactionIndex: pending extends true ? null : numberType
  /** `true` if this filter has been destroyed and is invalid */
  removed: boolean
}>

/** An RPC Log as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/receipt.yaml). */
export type Log_Rpc<pending extends boolean = boolean> = Log<pending, Hex, Hex>
