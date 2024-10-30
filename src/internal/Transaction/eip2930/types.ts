import type { AccessList } from '../../../AccessList.js'
import type { Hex } from '../../../Hex.js'
import type * as Transaction from '../../../Transaction.js'
import type { Compute } from '../../types.js'

/** An [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type TransactionEip2930<
  pending extends boolean = false,
  bigintType = bigint,
  numberType = number,
  type extends string = TransactionEip2930_Type,
> = Compute<
  Transaction.Base<type, pending, bigintType, numberType> & {
    /** EIP-2930 Access List. */
    accessList: AccessList
    /** The gas price willing to be paid by the sender (in wei). */
    gasPrice: bigintType
  }
>

/** An RPC [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type TransactionEip2930_Rpc<pending extends boolean = false> = Compute<
  TransactionEip2930<pending, Hex, Hex, TransactionEip2930_TypeRpc>
>

export type TransactionEip2930_Type = 'eip2930'

export type TransactionEip2930_TypeRpc = '0x1'
