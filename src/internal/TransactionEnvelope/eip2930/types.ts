import type { AccessList } from '../../AccessList/types.js'
import type { Address } from '../../Address/types.js'
import type { Hex } from '../../Hex/types.js'

export type TransactionEnvelopeEip2930<
  bigintType = bigint,
  numberType = number,
  type extends string = Type,
> = {
  /** EIP-2930 Access List. */
  accessList?: AccessList | undefined
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
  /** Base fee per gas. */
  gasPrice?: bigintType | undefined
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
}

export type Rpc = TransactionEnvelopeEip2930<Hex, Hex, '0x1'>

export type Serialized = `${SerializedType}${string}`

export type SerializedType = '0x01'

export type Type = 'eip2930'
