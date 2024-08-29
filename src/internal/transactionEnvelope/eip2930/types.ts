import type { AccessList } from '../../accessList/types.js'
import type { Compute } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeEip2930_Type = 'eip2930'

export type TransactionEnvelopeEip2930 = Compute<
  TransactionEnvelope_Base<TransactionEnvelopeEip2930_Type> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList | undefined
    /** EIP-155 Chain ID. */
    chainId: number
    /** Base fee per gas. */
    gasPrice?: bigint | undefined
  }
>

export type TransactionEnvelopeEip2930_SerializedType = '0x01'

export type TransactionEnvelopeEip2930_Serialized =
  `${TransactionEnvelopeEip2930_SerializedType}${string}`