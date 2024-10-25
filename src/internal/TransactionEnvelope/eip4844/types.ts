import type { AccessList } from '../../AccessList/types.js'
import type { Address } from '../../Address/types.js'
import type { BlobSidecar } from '../../Blobs/types.js'
import type { Hex } from '../../Hex/types.js'

export type TransactionEnvelopeEip4844<
  bigintType = bigint,
  numberType = number,
  type extends string = Type,
> = {
  /** EIP-2930 Access List. */
  accessList?: AccessList | undefined
  /** Versioned hashes of blobs to be included in the transaction. */
  blobVersionedHashes: readonly Hex[]
  /** EIP-155 Chain ID. */
  chainId: numberType
  /** Contract code or a hashed method call with encoded args */
  data?: Hex | undefined
  /** @alias `data` – added for TransactionEnvelope - Transaction compatibility. */
  input?: Hex | undefined
  /** Sender of the transaction. */
  from?: Address | undefined
  /** Gas provided for transaction execution */
  gas?: bigintType | undefined
  /** Maximum total fee per gas sender is willing to pay for blob gas (in wei). */
  maxFeePerBlobGas?: bigintType | undefined
  /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
  maxFeePerGas?: bigintType | undefined
  /** Max priority fee per gas (in wei). */
  maxPriorityFeePerGas?: bigintType | undefined
  /** Unique number identifying this transaction */
  nonce?: bigintType | undefined
  /** Transaction recipient */
  to?: Address | null | undefined
  /** Transaction type */
  type: type
  /** Value in wei sent with this transaction */
  value?: bigintType | undefined
  /** ECDSA signature r. */
  r?: bigintType | undefined
  /** ECDSA signature s. */
  s?: bigintType | undefined
  /** The sidecars associated with this transaction. When defined, the envelope is in the "network wrapper" format. */
  sidecars?: readonly BlobSidecar<Hex>[] | undefined
  /** ECDSA signature yParity. */
  yParity?: numberType | undefined
  /** @deprecated ECDSA signature v (for backwards compatibility). */
  v?: numberType | undefined
}

export type Rpc = TransactionEnvelopeEip4844<Hex, Hex, '0x3'>

export type Serialized = `${SerializedType}${string}`

export type SerializedType = '0x03'

export type Type = 'eip4844'
