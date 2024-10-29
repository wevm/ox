import type { Hex } from '../../../Hex.js'
import type { AccessList } from '../../AccessList/types.js'
import type { Authorization_ListSigned } from '../../Authorization/types.js'
import type { Compute } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeEip7702<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = TransactionEnvelopeEip7702_Type,
> = Compute<
  TransactionEnvelope_Base<type, signed, bigintType, numberType> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList | undefined
    /** EIP-7702 Authorization List. */
    authorizationList: Authorization_ListSigned<bigintType, numberType>
    /** EIP-155 Chain ID. */
    chainId: numberType
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas?: bigintType | undefined
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas?: bigintType | undefined
  }
>

export type TransactionEnvelopeEip7702_Rpc<signed extends boolean = boolean> =
  TransactionEnvelopeEip7702<signed, Hex, Hex, '0x4'>

export type TransactionEnvelopeEip7702_Serialized =
  `${TransactionEnvelopeEip7702_SerializedType}${string}`

export type TransactionEnvelopeEip7702_Signed = TransactionEnvelopeEip7702<true>

export type TransactionEnvelopeEip7702_SerializedType = '0x04'

export type TransactionEnvelopeEip7702_Type = 'eip7702'
