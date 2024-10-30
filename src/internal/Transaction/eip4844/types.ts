import type { AccessList } from '../../../AccessList.js'
import type { Hex } from '../../../Hex.js'
import type * as Transaction from '../../../Transaction.js'
import type { Compute } from '../../types.js'

/** An [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type TransactionEip4844<
  pending extends boolean = false,
  bigintType = bigint,
  numberType = number,
  type extends string = TransactionEip4844_Type,
> = Compute<
  Transaction.Base<type, pending, bigintType, numberType> & {
    /** EIP-2930 Access List. */
    accessList: AccessList
    /** List of versioned blob hashes associated with the transaction's blobs. */
    blobVersionedHashes: readonly Hex[]
    /** Total fee per blob gas in wei. */
    maxFeePerBlobGas: bigintType
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas: bigintType
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas: bigintType
  }
>

/** An RPC [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type TransactionEip4844_Rpc<pending extends boolean = false> = Compute<
  TransactionEip4844<pending, Hex, Hex, TransactionEip4844_TypeRpc>
>

export type TransactionEip4844_Type = 'eip4844'

export type TransactionEip4844_TypeRpc = '0x3'
