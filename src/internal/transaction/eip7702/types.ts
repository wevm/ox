import type { AccessList } from '../../accessList/types.js'
import type { Authorization_ListSigned } from '../../authorization/types.js'
import type { Hex } from '../../hex/types.js'
import type { Compute } from '../../types.js'
import type { Transaction_Base } from '../types.js'

/** An [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Transaction_Eip7702<
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = Transaction_Eip7702Type,
> = Compute<
  Transaction_Base<type, pending, numberType, bigintType> & {
    /** EIP-2930 Access List. */
    accessList: AccessList
    /** EIP-7702 Authorization list for the transaction. */
    authorizationList: Authorization_ListSigned<bigintType, numberType>
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas: bigintType
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas: bigintType
  }
>

/** An RPC [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Transaction_Eip7702Rpc<pending extends boolean = boolean> = Compute<
  Transaction_Eip7702<pending, Hex, Hex, Transaction_Eip7702Type>
>

export type Transaction_Eip7702Type = 'eip7702'

export type Transaction_Eip7702TypeRpc = '0x4'