import type { Address } from 'abitype'
import type { AccessList } from '../accessList/types.js'
import type { Authorization_List } from '../authorization/types.js'
import type { BlobSidecar } from '../blobs/types.js'
import type { Hex } from '../hex/types.js'
import type { Signature, Signature_Legacy } from '../signature/types.js'
import type {
  Branded,
  Compute,
  ExactPartial,
  IsNarrowable,
  IsNever,
  OneOf,
} from '../types.js'

export type TransactionEnvelope_Type =
  | 'legacy'
  | 'eip1559'
  | 'eip2930'
  | 'eip4844'
  | 'eip7702'
  | (string & {})

export type TransactionEnvelope = OneOf<
  | TransactionEnvelope_Legacy
  | TransactionEnvelope_Eip1559
  | TransactionEnvelope_Eip2930
  | TransactionEnvelope_Eip4844
  | TransactionEnvelope_Eip7702
>

export type TransactionEnvelope_Base<
  type extends TransactionEnvelope_Type = TransactionEnvelope_Type,
> = {
  /** Contract code or a hashed method call with encoded args */
  data?: Hex | undefined
  /** @alias `data` – added for JSON-RPC backwards compatibility. */
  input?: Hex | undefined
  /** Gas provided for transaction execution */
  gas?: bigint | undefined
  /** Unique number identifying this transaction */
  nonce?: bigint | undefined
  /** Transaction recipient */
  to?: Address | undefined
  /** Transaction type */
  type: type
  /** Value in wei sent with this transaction */
  value?: bigint | undefined
}

/////////////////////////////////////////////////////////////////////////
// Transaction Types
/////////////////////////////////////////////////////////////////////////

export type TransactionEnvelope_Legacy = Compute<
  TransactionEnvelope_Base<'legacy'> & {
    /** EIP-155 Chain ID. */
    chainId?: number | undefined
    /** Base fee per gas. */
    gasPrice?: bigint | undefined
  } & ExactPartial<Signature_Legacy>
>

export type TransactionEnvelope_Eip1559 = Compute<
  TransactionEnvelope_Base<'eip1559'> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList | undefined
    /** EIP-155 Chain ID. */
    chainId: number
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas?: bigint | undefined
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas?: bigint | undefined
  } & ExactPartial<Signature | Signature_Legacy>
>

export type TransactionEnvelope_Eip2930 = Compute<
  TransactionEnvelope_Base<'eip2930'> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList | undefined
    /** EIP-155 Chain ID. */
    chainId: number
    /** Base fee per gas. */
    gasPrice?: bigint | undefined
  } & ExactPartial<Signature | Signature_Legacy>
>

export type TransactionEnvelope_Eip4844 = Compute<
  TransactionEnvelope_Base<'eip4844'> & {
    /** EIP-2930 Access List. */
    accessList?: AccessList | undefined
    /** Versioned hashes of blobs to be included in the transaction. */
    blobVersionedHashes: readonly Hex[]
    /** EIP-155 Chain ID. */
    chainId: number
    /** Maximum total fee per gas sender is willing to pay for blob gas (in wei). */
    maxFeePerBlobGas?: bigint | undefined
    /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
    maxFeePerGas?: bigint | undefined
    /** Max priority fee per gas (in wei). */
    maxPriorityFeePerGas?: bigint | undefined
    /** The sidecars associated with this transaction. When defined, the envelope is in the "network wrapper" format. */
    sidecars?: readonly BlobSidecar<Hex>[] | undefined
  } & ExactPartial<Signature>
>

export type TransactionEnvelope_Eip7702 = Compute<
  TransactionEnvelope_Base<'eip7702'> & {
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
  } & ExactPartial<Signature>
>

export type TransactionEnvelope_SerializedEip1559 = `0x02${string}`
export type TransactionEnvelope_SerializedEip2930 = `0x01${string}`
export type TransactionEnvelope_SerializedEip4844 = `0x03${string}`
export type TransactionEnvelope_SerializedEip7702 = `0x04${string}`
export type TransactionEnvelope_SerializedLegacy = Branded<
  `0x${string}`,
  'legacy'
>
export type TransactionEnvelope_Serialized<
  type extends TransactionEnvelope_Type = TransactionEnvelope_Type,
  result =
    | (type extends 'eip1559' ? TransactionEnvelope_SerializedEip1559 : never)
    | (type extends 'eip2930' ? TransactionEnvelope_SerializedEip2930 : never)
    | (type extends 'eip4844' ? TransactionEnvelope_SerializedEip4844 : never)
    | (type extends 'eip7702' ? TransactionEnvelope_SerializedEip7702 : never)
    | (type extends 'legacy' ? TransactionEnvelope_SerializedLegacy : never),
> = IsNarrowable<type, string> extends true
  ? IsNever<result> extends true
    ? `0x${string}`
    : result
  : `0x${string}`
