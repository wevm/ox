import type { AccessList } from '../../AccessList/types.js'
import type { Hex } from '../../Hex/types.js'
import type { Compute } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeEip2930<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = TransactionEnvelopeEip2930_Type,
> = Compute<
  TransactionEnvelope_Base<type, signed, bigintType, numberType> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList | undefined
    /** EIP-155 Chain ID. */
    chainId: numberType
    /** Base fee per gas. */
    gasPrice?: bigintType | undefined
  }
>

export type TransactionEnvelopeEip2930_Rpc<signed extends boolean = boolean> =
  TransactionEnvelopeEip2930<signed, Hex, Hex, '0x1'>

export type TransactionEnvelopeEip2930_Serialized =
  `${TransactionEnvelopeEip2930_SerializedType}${string}`

export type TransactionEnvelopeEip2930_Signed = TransactionEnvelopeEip2930<true>

export type TransactionEnvelopeEip2930_SerializedType = '0x01'

export type TransactionEnvelopeEip2930_Type = 'eip2930'
