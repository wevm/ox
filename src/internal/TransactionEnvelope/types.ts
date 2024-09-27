import type { Address } from '../Address/types.js'
import type { Hex } from '../Hex/types.js'
import type { Compute } from '../types.js'

/** Base type for a Transaction Envelope. Transaction Envelopes inherit this type. */
export type TransactionEnvelope_Base<
  type extends string = string,
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<
  {
    /** Contract code or a hashed method call with encoded args */
    data?: Hex | undefined
    /** @alias `data` – added for TransactionEnvelope - Transaction compatibility. */
    input?: Hex | undefined
    /** Sender of the transaction. */
    from?: Address | undefined
    /** Gas provided for transaction execution */
    gas?: bigintType | undefined
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
    /** ECDSA signature yParity. */
    yParity?: numberType | undefined
    /** @deprecated ECDSA signature v (for backwards compatibility). */
    v?: numberType | undefined
  } & (signed extends true ? { r: bigintType; s: bigintType } : {})
>

/** RPC representation of a {@link ox#TransactionEnvelope.Base}. */
export type TransactionEnvelope_BaseRpc<
  type extends string = string,
  signed extends boolean = boolean,
> = TransactionEnvelope_Base<type, signed, Hex, Hex>

/** Signed representation of a {@link ox#TransactionEnvelope.Base}. */
export type TransactionEnvelope_BaseSigned<type extends string = string> =
  TransactionEnvelope_Base<type, true>
