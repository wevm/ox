import type { Hex } from '../../hex/types.js'
import type { Compute } from '../../types.js'
import type { Transaction_Base } from '../types.js'

export type Transaction_Legacy<
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  Transaction_Base<'legacy', pending, numberType, bigintType> & {
    /** The gas price willing to be paid by the sender (in wei). */
    gasPrice: bigintType
  }
>

export type Transaction_LegacyRpc<pending extends boolean = boolean> = Compute<
  Transaction_Legacy<pending, Hex, Hex>
>
