import type { Hex } from '../../../Hex.js'
import type { Compute } from '../../types.js'
import type { Transaction_Base } from '../types.js'

/** An legacy Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type TransactionLegacy<
  pending extends boolean = false,
  bigintType = bigint,
  numberType = number,
  type extends string = TransactionLegacy_Type,
> = Compute<
  Omit<
    Transaction_Base<type, pending, bigintType, numberType>,
    'chainId' | 'v' | 'yParity'
  > & {
    chainId?: numberType | undefined
    /** The gas price willing to be paid by the sender (in wei). */
    gasPrice: bigintType
    /** ECDSA signature v. */
    v: numberType
    /** ECDSA signature yParity. */
    yParity?: numberType | undefined
  }
>

/** A legacy RPC Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml). */
export type TransactionLegacy_Rpc<pending extends boolean = false> = Compute<
  TransactionLegacy<pending, Hex, Hex, TransactionLegacy_TypeRpc>
>

export type TransactionLegacy_Type = 'legacy'

export type TransactionLegacy_TypeRpc = '0x0'
