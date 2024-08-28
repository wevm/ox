import type { AccessList } from '../../accessList/types.js'
import type { Compute } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeEip1559_Type = 'eip1559'

export type TransactionEnvelopeEip1559 = Compute<
  TransactionEnvelope_Base<TransactionEnvelopeEip1559_Type> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList | undefined
    /** EIP-155 Chain ID. */
    chainId: number
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas?: bigint | undefined
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas?: bigint | undefined
  }
>

export type TransactionEnvelopeEip1559_SerializedType = '0x02'

export type TransactionEnvelopeEip1559_Serialized =
  `${TransactionEnvelopeEip1559_SerializedType}${string}`
