import type { AccessList } from '../../accessList/types.js'
import type { Hex } from '../../hex/types.js'
import type { Compute } from '../../types.js'
import type { Transaction_Base } from '../types.js'

/** An [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Transaction_Eip4844<
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = 'eip4844',
> = Compute<
  Transaction_Base<type, pending, numberType, bigintType> & {
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

/** An RPC [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Transaction_Eip4844Rpc<pending extends boolean = boolean> = Compute<
  Transaction_Eip4844<pending, Hex, Hex, '0x3'>
>
