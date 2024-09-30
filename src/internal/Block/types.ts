import type { Address } from 'abitype'
import type { Hex } from '../Hex/types.js'
import type {
  Transaction,
  Transaction_Rpc,
} from '../Transaction/isomorphic/types.js'
import type { Withdrawal } from '../Withdrawal/types.js'
import type { Compute } from '../types.js'

/** A Block as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/block.yaml). */
export type Block<
  includeTransactions extends boolean = false,
  blockTag extends Block_Tag = 'latest',
  bigintType = bigint,
  numberType = number,
  transaction = Transaction<
    blockTag extends 'pending' ? true : false,
    bigintType,
    numberType
  >,
> = Compute<{
  /** Base fee per gas */
  baseFeePerGas?: bigintType | undefined
  /** Total used blob gas by all transactions in this block */
  blobGasUsed?: bigintType | undefined
  /** Difficulty for this block */
  difficulty?: bigintType | undefined
  /** Excess blob gas */
  excessBlobGas?: bigintType | undefined
  /** "Extra data" field of this block */
  extraData?: Hex | undefined
  /** Maximum gas allowed in this block */
  gasLimit: bigintType
  /** Total used gas by all transactions in this block */
  gasUsed: bigintType
  /** Block hash or `null` if pending */
  hash: blockTag extends 'pending' ? null : Hex
  /** Logs bloom filter or `null` if pending */
  logsBloom: blockTag extends 'pending' ? null : Hex
  /** Address that received this block’s mining rewards */
  miner: Address
  /** Unique identifier for the block. */
  mixHash: Hex
  /** Proof-of-work hash or `null` if pending */
  nonce: blockTag extends 'pending' ? null : Hex
  /** Block number or `null` if pending */
  number: blockTag extends 'pending' ? null : bigintType
  parentBeaconBlockRoot?: Hex | undefined
  /** Parent block hash */
  parentHash: Hex
  /** Root of the this block’s receipts trie */
  receiptsRoot: Hex
  sealFields?: readonly Hex[] | undefined
  /** SHA3 of the uncles data in this block */
  sha3Uncles: Hex
  /** Size of this block in bytes */
  size: bigintType
  /** Root of this block’s final state trie */
  stateRoot: Hex
  /** Unix timestamp of when this block was collated */
  timestamp: bigintType
  /** Total difficulty of the chain until this block */
  totalDifficulty?: bigintType | undefined
  /** List of transaction objects or hashes */
  transactions: includeTransactions extends true
    ? readonly transaction[]
    : readonly Hex[]
  /** Root of this block’s transaction trie */
  transactionsRoot: Hex
  /** List of uncle hashes */
  uncles: readonly Hex[]
  /** List of withdrawal objects */
  withdrawals?: readonly Withdrawal<bigintType, numberType>[] | undefined
  /** Root of the this block’s withdrawals trie */
  withdrawalsRoot?: Hex | undefined
}>

/** A Block hash. */
export type Block_Hash = Hex

/** A Block number. */
export type Block_Number<bigintType = bigint> = bigintType

/** An RPC Block as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/block.yaml). */
export type Block_Rpc<
  includeTransactions extends boolean = boolean,
  blockTag extends Block_Tag = 'latest',
  transaction = Transaction_Rpc<blockTag extends 'pending' ? true : false>,
> = Block<includeTransactions, blockTag, Hex, Hex, transaction>

/**
 * A Block Tag as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/block.yaml).
 *
 * - `earliest`: The lowest numbered block the client has available;
 * - `finalized`: The most recent crypto-economically secure block, cannot be re-orged outside of manual intervention driven by community coordination;
 * - `safe`: The most recent block that is safe from re-orgs under honest majority and certain synchronicity assumptions;
 * - `latest`: The most recent block in the canonical chain observed by the client, this block may be re-orged out of the canonical chain even under healthy/normal conditions;
 * - `pending`: A sample next block built by the client on top of `latest` and containing the set of transactions usually taken from local mempool.
 */
export type Block_Tag = 'latest' | 'earliest' | 'pending' | 'safe' | 'finalized'
