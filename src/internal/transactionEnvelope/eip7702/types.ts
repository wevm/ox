import type { AccessList } from '../../accessList/types.js'
import type { Authorization_List } from '../../authorization/types.js'
import type { Compute } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeEip7702_Type = 'eip7702'

export type TransactionEnvelopeEip7702 = Compute<
  TransactionEnvelope_Base<TransactionEnvelopeEip7702_Type> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList | undefined
    /** EIP-7702 Authorization List. */
    authorizationList: Authorization_List<true>
    /** EIP-155 Chain ID. */
    chainId: number
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas?: bigint | undefined
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas?: bigint | undefined
  }
>

export type TransactionEnvelopeEip7702_SerializedType = '0x04'

export type TransactionEnvelopeEip7702_Serialized =
  `${TransactionEnvelopeEip7702_SerializedType}${string}`
