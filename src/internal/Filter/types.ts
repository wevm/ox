import type { Hex } from '../../Hex.js'
import type { Address } from '../Address/types.js'
import type { Block_Number, Block_Tag } from '../Block/types.js'
import type { Compute } from '../types.js'

/** A Filter as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/filter.yaml). */
export type Filter<bigintType = bigint> = Compute<{
  /** Address to filter for logs. */
  address?: Address | readonly Address[] | null | undefined
  /** Block number or tag to filter logs from. */
  fromBlock?: Block_Number<bigintType> | Block_Tag | undefined
  /** Block number or tag to filter logs to. */
  toBlock?: Block_Number<bigintType> | Block_Tag | undefined
  /** Topics to filter for logs. */
  topics?: Filter_Topics | undefined
}>

/** RPC representation of a {@link ox#Filter.Filter}. */
export type Filter_Rpc = Filter<Hex>

/** Set of Filter topics. */
export type Filter_Topics = readonly Filter_Topic[]

/**
 * A filter topic.
 *
 * - `null`: Matches any topic.
 * - `Hex`: Matches if the topic is equal.
 * - `Hex[]`: Matches if the topic is in the array.
 */
export type Filter_Topic = Hex | readonly Hex[] | null
