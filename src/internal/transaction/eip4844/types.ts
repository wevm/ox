import type { AccessList } from '../../accessList/types.js'
import type { Hex } from '../../hex/types.js'
import type { Compute } from '../../types.js'
import type { Transaction_Base } from '../types.js'

export type Transaction_Eip4844<
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  Transaction_Base<'eip4844', pending, numberType, bigintType> & {
    /** EIP-2930 Access List. */
    accessList: AccessList
    /** List of versioned blob hashes associated with the transaction's blobs. */
    blobVersionedHashes: readonly Hex[]
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas: bigintType
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas: bigintType
  }
>

export type Transaction_Eip4844Rpc<pending extends boolean = boolean> = Compute<
  Transaction_Eip4844<pending, Hex, Hex>
>
