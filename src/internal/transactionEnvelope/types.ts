import type { Address } from '../address/types.js'
import type { Hex } from '../hex/types.js'
import type { Compute } from '../types.js'

export type TransactionEnvelope_Base<
  type extends string = string,
  signed extends boolean = boolean,
> = Compute<
  {
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
    /** ECDSA signature r. */
    r?: bigint | undefined
    /** ECDSA signature s. */
    s?: bigint | undefined
    /** ECDSA signature yParity. */
    yParity?: 0 | 1 | undefined
    /** @deprecated ECDSA signature v (for backwards compatibility). */
    v?: number | undefined
  } & (signed extends true ? { r: bigint; s: bigint } : {})
>

export type TransactionEnvelope_BaseSigned<type extends string = string> =
  TransactionEnvelope_Base<type, true>
