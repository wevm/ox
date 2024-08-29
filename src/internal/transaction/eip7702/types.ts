import type { AccessList } from '../../accessList/types.js'
import type { Authorization_ListSigned } from '../../authorization/types.js'
import type { Hex } from '../../hex/types.js'
import type { Compute } from '../../types.js'
import type { Transaction_Base } from '../types.js'

export type Transaction_Eip7702<
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  Transaction_Base<'eip7702', pending, numberType, bigintType> & {
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

export type Transaction_Eip7702Rpc<pending extends boolean = boolean> = Compute<
  Transaction_Eip7702<pending, Hex, Hex>
>
