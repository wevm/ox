import type { AccessList } from '../../AccessList/types.js'
import type { BlobSidecar } from '../../Blobs/types.js'
import type { Hex } from '../../Hex/types.js'
import type { Compute } from '../../types.js'
import type { TransactionEnvelope_Base } from '../types.js'

export type TransactionEnvelopeEip4844<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
  type extends string = TransactionEnvelopeEip4844_Type,
> = Compute<
  TransactionEnvelope_Base<type, signed, bigintType, numberType> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList | undefined
    /** Versioned hashes of blobs to be included in the transaction. */
    blobVersionedHashes: readonly Hex[]
    /** EIP-155 Chain ID. */
    chainId: numberType
    /** Maximum total fee per gas sender is willing to pay for blob gas (in wei). */
    maxFeePerBlobGas?: bigintType | undefined
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas?: bigintType | undefined
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas?: bigintType | undefined
    /** The sidecars associated with this transaction. When defined, the envelope is in the "network wrapper" format. */
    sidecars?: readonly BlobSidecar<Hex>[] | undefined
  }
>

export type TransactionEnvelopeEip4844_Rpc<signed extends boolean = boolean> =
  TransactionEnvelopeEip4844<signed, Hex, Hex, '0x3'>

export type TransactionEnvelopeEip4844_Serialized =
  `${TransactionEnvelopeEip4844_SerializedType}${string}`

export type TransactionEnvelopeEip4844_SerializedType = '0x03'

export type TransactionEnvelopeEip4844_Signed = TransactionEnvelopeEip4844<true>

export type TransactionEnvelopeEip4844_Type = 'eip4844'
