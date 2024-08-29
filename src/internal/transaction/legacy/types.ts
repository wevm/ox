import type { Hex } from '../../hex/types.js'
import type { Compute } from '../../types.js'
import type { Transaction_Base } from '../types.js'

/** An legacy Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Transaction_Legacy<
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = 'legacy',
> = Compute<
  Transaction_Base<type, pending, numberType, bigintType> & {
    /** The gas price willing to be paid by the sender (in wei). */
    gasPrice: bigintType
  }
>

/** A legacy RPC Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type Transaction_LegacyRpc<pending extends boolean = boolean> = Compute<
  Transaction_Legacy<pending, Hex, Hex, '0x0'>
>
