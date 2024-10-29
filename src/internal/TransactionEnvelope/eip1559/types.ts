import type { Hex } from '../../../Hex.js'
import type { AccessList } from '../../AccessList/types.js'
import type { Compute } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeEip1559<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = TransactionEnvelopeEip1559_Type,
> = Compute<
  TransactionEnvelope_Base<type, signed, bigintType, numberType> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList | undefined
    /** EIP-155 Chain ID. */
    chainId: numberType
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas?: bigintType | undefined
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas?: bigintType | undefined
  }
>

export type TransactionEnvelopeEip1559_Rpc<signed extends boolean = boolean> =
  TransactionEnvelopeEip1559<signed, Hex, Hex, '0x2'>

export type TransactionEnvelopeEip1559_Serialized =
  `${TransactionEnvelopeEip1559_SerializedType}${string}`

export type TransactionEnvelopeEip1559_SerializedType = '0x02'

export type TransactionEnvelopeEip1559_Signed = TransactionEnvelopeEip1559<true>

export type TransactionEnvelopeEip1559_Type = 'eip1559'
