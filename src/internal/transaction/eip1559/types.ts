import type { AccessList } from '../../accessList/types.js'
import type { Hex } from '../../hex/types.js'
import type { Compute } from '../../types.js'
import type { Transaction_Base } from '../types.js'

/** An [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Transaction_Eip1559<
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = Transaction_Eip1559Type,
> = Compute<
  Transaction_Base<type, pending, numberType, bigintType> & {
    /** EIP-2930 Access List. */
    accessList: AccessList
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas: bigintType
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas: bigintType
  }
>

/** An [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) RPC Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Transaction_Eip1559Rpc<pending extends boolean = boolean> = Compute<
  Transaction_Eip1559<pending, Hex, Hex, Transaction_Eip1559TypeRpc>
>

export type Transaction_Eip1559Type = 'eip1559'

export type Transaction_Eip1559TypeRpc = '0x1'
