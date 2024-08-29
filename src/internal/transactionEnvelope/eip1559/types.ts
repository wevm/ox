import type { AccessList } from '../../accessList/types.js'
import type { Hex } from '../../hex/types.js'
import type { Compute } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeEip1559<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  TransactionEnvelope_Base<
    TransactionEnvelopeEip1559_Type,
    signed,
    bigintType,
    numberType
  > & {
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

export type TransactionEnvelopeEip1559_Rpc = TransactionEnvelopeEip1559<
  true,
  Hex,
  Hex
>

export type TransactionEnvelopeEip1559_Serialized =
  `${TransactionEnvelopeEip1559_SerializedType}${string}`

export type TransactionEnvelopeEip1559_SerializedType = '0x02'

export type TransactionEnvelopeEip1559_Signed = TransactionEnvelopeEip1559<true>

export type TransactionEnvelopeEip1559_Type = 'eip1559'
