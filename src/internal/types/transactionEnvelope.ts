import type { Address } from 'abitype'
import type { Hex } from './data.js'
import type { LegacySignature, Signature } from './signature.js'
import type { Compute, IsNarrowable, OneOf } from './utils.js'
import type { AccessList } from './accessList.js'
import type { BlobSidecar } from './blob.js'
import type { AuthorizationList } from './authorization.js'

export type TransactionType =
  | 'legacy'
  | 'eip1559'
  | 'eip2930'
  | 'eip4844'
  | 'eip7702'
  | (string & {})

export type TransactionEnvelope = OneOf<
  | TransactionEnvelopeLegacy
  | TransactionEnvelopeEip1559
  | TransactionEnvelopeEip2930
  | TransactionEnvelopeEip4844
  | TransactionEnvelopeEip7702
>

export type TransactionEnvelopeBase<
  type extends TransactionType = TransactionType,
> = {
  /** Contract code or a hashed method call with encoded args */
  data?: Hex | undefined
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

export type TransactionEnvelopeLegacy<signed extends boolean = boolean> =
  Compute<
    TransactionEnvelopeBase<'legacy'> & {
      /** EIP-155 Chain ID. */
      chainId?: number | undefined
      /** Base fee per gas. */
      gasPrice?: bigint | undefined
    } & ComputeSignature<LegacySignature, signed>
  >

export type TransactionEnvelopeEip1559<signed extends boolean = boolean> =
  Compute<
    TransactionEnvelopeBase<'eip1559'> & {
      /** EIP-2930 Access List. */
      accessList?: AccessList | undefined
      /** EIP-155 Chain ID. */
      chainId: number
      /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
      maxFeePerGas?: bigint | undefined
      /** Max priority fee per gas (in wei). */
      maxPriorityFeePerGas?: bigint | undefined
    } & ComputeSignature<Signature | LegacySignature, signed>
  >

export type TransactionEnvelopeEip2930<signed extends boolean = boolean> =
  Compute<
    TransactionEnvelopeBase<'eip2930'> & {
      /** EIP-2930 Access List. */
      accessList?: AccessList | undefined
      /** EIP-155 Chain ID. */
      chainId: number
      /** Base fee per gas. */
      gasPrice?: bigint | undefined
    } & ComputeSignature<Signature | LegacySignature, signed>
  >

export type TransactionEnvelopeEip4844<signed extends boolean = boolean> =
  Compute<
    TransactionEnvelopeBase<'eip4844'> & {
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
      /** The sidecars associated with this transaction. When `false`, sidecars are not attached to the envelope. */
      sidecars?: readonly BlobSidecar<Hex>[] | false | undefined
    } & ComputeSignature<Signature, signed>
  >

export type TransactionEnvelopeEip7702<signed extends boolean = boolean> =
  Compute<
    TransactionEnvelopeBase<'eip7702'> & {
      /** EIP-7702 Authorization List. */
      authorizationList: AuthorizationList<true>
      /** EIP-155 Chain ID. */
      chainId: number
      /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
      maxFeePerGas?: bigint | undefined
      /** Max priority fee per gas (in wei). */
      maxPriorityFeePerGas?: bigint | undefined
    } & ComputeSignature<Signature, signed>
  >

/////////////////////////////////////////////////////////////////////////
// Utilities
/////////////////////////////////////////////////////////////////////////

/** @internal */
export type ComputeSignature<
  signature extends Signature | LegacySignature,
  signed extends boolean | undefined,
> = IsNarrowable<signed, true> extends true
  ? OneOf<signature | {}>
  : signed extends true
    ? OneOf<signature>
    : {}
