import type { AccessList } from '../../accessList/types.js'
import type { Hex } from '../../hex/types.js'
import type { Compute } from '../../types.js'
import type { Transaction_Base } from '../types.js'

export type Transaction_Eip2930<
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  Transaction_Base<'eip2930', pending, numberType, bigintType> & {
    /** EIP-2930 Access List. */
    accessList: AccessList
    /** The gas price willing to be paid by the sender (in wei). */
    gasPrice: bigintType
  }
>

export type Transaction_Eip2930Rpc<pending extends boolean = boolean> = Compute<
  Transaction_Eip2930<pending, Hex, Hex>
>
