import type { AccessList } from '../../accessList/types.js'
import type { Hex } from '../../hex/types.js'
import type { Compute } from '../../types.js'
import type { Transaction_Base } from '../types.js'

/** An [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Transaction_Eip2930<
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = Transaction_Eip2930Type,
> = Compute<
  Transaction_Base<type, pending, numberType, bigintType> & {
    /** EIP-2930 Access List. */
    accessList: AccessList
    /** The gas price willing to be paid by the sender (in wei). */
    gasPrice: bigintType
  }
>

/** An RPC [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Transaction_Eip2930Rpc<pending extends boolean = boolean> = Compute<
  Transaction_Eip2930<pending, Hex, Hex, Transaction_Eip2930TypeRpc>
>

export type Transaction_Eip2930Type = 'eip2930'

export type Transaction_Eip2930TypeRpc = '0x2'
