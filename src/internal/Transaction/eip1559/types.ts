import type { AccessList } from '../../../AccessList.js'
import type { Hex } from '../../../Hex.js'
import type * as Transaction from '../../../Transaction.js'
import type { Compute } from '../../types.js'

/** An [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type TransactionEip1559<
  pending extends boolean = false,
  bigintType = bigint,
  numberType = number,
  type extends string = TransactionEip1559_Type,
> = Compute<
  Transaction.Base<type, pending, bigintType, numberType> & {
    /** EIP-2930 Access List. */
    accessList: AccessList
    /** Effective gas price paid by the sender in wei. */
    gasPrice?: bigintType | undefined
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas: bigintType
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas: bigintType
  }
>

/** An [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) RPC Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type TransactionEip1559_Rpc<pending extends boolean = false> = Compute<
  TransactionEip1559<pending, Hex, Hex, TransactionEip1559_TypeRpc>
>

export type TransactionEip1559_Type = 'eip1559'

export type TransactionEip1559_TypeRpc = '0x2'
